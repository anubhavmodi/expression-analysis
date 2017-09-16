import { Component, OnInit, ElementRef } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import * as RecordRTC from 'recordrtc';
import 'rxjs/add/operator/map';
import { VideoAnalysis } from '../common/cognitive-api/video-analysis';
import { ImageAnalysis } from '../common/cognitive-api/image-analysis';
import { CognitiveApiService } from '../common/cognitive-api/cognitive-api.service'

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})

export class MainComponent implements OnInit {
    constructor(private elementRef: ElementRef, private _cognitiveApiService: CognitiveApiService) {
        
    }
    localMediaStream = null;
    recorder;
    responseURL;
    analysisResult;
    videoRecordingStarted:boolean=false;
    videoRecorded:boolean=false;
    analysisInProgress:boolean=false;
    analysisCompleted:boolean=false;
    faceAnalysisInProgress:boolean=false;
    faceAnalysisCompleted:boolean=false;
    analysisStatus:Array<string>;
    faceAnalysisStatus:Array<string>;
    age;
    gender;

    ngOnInit() {
        //this.startStreaming();
    }

    startStreaming() {
        let video = this.elementRef.nativeElement.children.item(1);
        let component = this;
        if (navigator.getUserMedia) {
            navigator.getUserMedia({
                audio: true,
                video: true
            }, function(stream) {
                video.src = window.URL.createObjectURL(stream);
                component.localMediaStream = stream;
            }, function() {

            });
        } else {
            video.src = 'somevideo.webm'; // fallback.
        }
    }

    snapshot() {
        let component = this;
        if (this.localMediaStream) {
            let video = this.elementRef.nativeElement.children.item(1).children;
            let canvas = this.elementRef.nativeElement.children.item(3);
            let image = this.elementRef.nativeElement.children.item(2);
            let ctx = canvas.getContext('2d');
            ctx.drawImage(video[0], 0, 0, 200, 200);
            image.src = canvas.toDataURL('image/jpeg');
            this.faceAnalysisStatus = ["Fetching face analysis results...."];
            this._cognitiveApiService.postImageForAnalysis(image.src).subscribe(
                result => {
                    if (result.completed) {
                        component.faceAnalysisInProgress = false;
                        component.faceAnalysisCompleted = true;
                        component.age = result.data.faceAttributes.age;
                        component.gender = result.data.faceAttributes.gender;
                    }else{
                        component.faceAnalysisStatus.push('Face analysis not completed....');
                    }
                }
            );
        }
    }


    startVideoCapture() {
        let mediaConstraints = {
            video: {
                mandatory: {
                    minWidth: 1280,
                    minHeight: 720
                }
            },
            audio: true
        };
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(this.startRecording.bind(this), function() {});

    }

    startRecording(stream) {
    	this.videoRecordingStarted = true;
    	this.videoRecorded = false;
        let video = this.elementRef.nativeElement.children.item(1).children.item(0);
        var options = {
            mimeType: 'video/mp4'
        };
        this.recorder = RecordRTC(stream, options);
        video.src = window.URL.createObjectURL(stream);
        this.localMediaStream = stream;
        this.recorder.startRecording();
    }

    stopRecording() {
    	this.videoRecordingStarted = false;
    	this.videoRecorded = true;
        this.recorder.stopRecording(this.processVideo.bind(this));
        let stream = this.localMediaStream;
        stream.getAudioTracks().forEach(track => track.stop());
        stream.getVideoTracks().forEach(track => track.stop());
    }

    analyzeVideo() {
    	if(this.recorder.getBlob() == null){
    		alert("Record video for analysis");
    		return;
    	}
    	this.analysisInProgress = true;
    	this.analysisCompleted = false;
    	this.analysisStatus = ["Uploading video for analysis..."];
        this._cognitiveApiService.postVideoForAnalysis(this.recorder.getBlob()).subscribe(
            result => {
            	this.analysisStatus.push('Uploading video completed....');
                this.getResult(result);
            }
        );
    }

    getResult(result) {
        let component = this;
        setTimeout(function() {
            component.analysisStatus.push('Fetching analysis results....');
            component._cognitiveApiService.getVideoAnalysis(result).subscribe(
                response => {
                    if (response.completed) {
                    	component.analysisInProgress = false;
    					component.analysisCompleted = true;
    					component.analysisResult = response.data;
                        component.faceAnalysisInProgress = true;
                        component.faceAnalysisCompleted = false;
                        component.snapshot();
                    }else{
            			component.analysisStatus.push('Video analysis not completed....');
                        component.getResult(result);
                    }
                }
            );
        }, 10000);
    }

    processVideo(audioVideoWebMURL) {
        let video = this.elementRef.nativeElement.children.item(1).children.item(0);
        video.src = audioVideoWebMURL;
        //  this.recorder.save('video.webm');
    }
}
	
