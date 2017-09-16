import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import * as RecordRTC from 'recordrtc';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import { VideoAnalysis } from './video-analysis';
import { ImageAnalysis } from './image-analysis';
import { WindowMeanScores } from './window-mean-scores';

@Injectable()
export class CognitiveApiService {
	private _requestOptions:RequestOptions;
  private _requestImageOptions:RequestOptions;
	private _EMOTION_VIDEO_API = 'https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognizeinvideo?outputStyle=aggregate';
  private _FACE_API = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=true&returnFaceAttributes=age%2Cgender%2CheadPose%2Csmile%2CfacialHair%2Cglasses%2Cemotion%2Chair%2Cmakeup%2Cocclusion%2Caccessories%2Cblur%2Cexposure%2Cnoise';
  	constructor(private _http: Http) { 
  		this._requestOptions = new RequestOptions();
    	this._requestOptions.headers = new Headers();
    	this._requestOptions.headers.append("Ocp-Apim-Subscription-Key", "e9428e6688094bb0902a6f135f03e31e");

      this._requestImageOptions = new RequestOptions();
      this._requestImageOptions.headers = new Headers();
      this._requestImageOptions.headers.append("Ocp-Apim-Subscription-Key", "4eac635800054da4a26616c654cdd9cc");
  	}

    dataURItoBlob(dataURI) {
        var byteString = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        var bb = new Blob([ab]);
        return bb;
    }

  	postVideoForAnalysis(blob:any) {
    	this._requestOptions.headers.append("Content-Type", "application/octet-stream");
    	return this._http.post(this._EMOTION_VIDEO_API, blob, this._requestOptions)
    		.map(this._extractOperationLocation.bind(this))
    		.catch(this._handleError.bind(this));
  	}

    postImageForAnalysis(data:string):Observable<ImageAnalysis> {
      this._requestImageOptions.headers.append("Content-Type", "application/octet-stream");
      return this._http.post(this._FACE_API, this.dataURItoBlob(data), this._requestImageOptions)
        .map(this._extractFaceDetails.bind(this))
        .catch(this._handleError.bind(this));
    }

  	private _extractOperationLocation(response:Response):string{
  		return response.headers.get("operation-location");
  	}

  	getVideoAnalysis(url:string):Observable<VideoAnalysis>{
    	this._requestOptions.headers.delete("Content-Type");
  		return this._http.get(url, this._requestOptions).map(this._extractVideoAnalysis.bind(this));
  	}

  	private _extractVideoAnalysis(response:Response){
  		let result = response.json();
  		let videoAnalysisResponse:VideoAnalysis = new VideoAnalysis();
  		switch(result.status){
  			case 'Succeeded':{
  				if(result.progress === 100){
  					videoAnalysisResponse.completed = true;
  					videoAnalysisResponse.data = this._getVideoAnalysis(result.processingResult);
  				}
  				break;
  			}
  			case 'Running':{
  				videoAnalysisResponse.completed = false;
  				break;
  			}
  		}
  		return videoAnalysisResponse;
  	}

    private _extractFaceDetails(response:Response){
      let result = response.json();
      let ImageAnalysisResponse:ImageAnalysis = new ImageAnalysis();
      if(response.status === 200){
        ImageAnalysisResponse.completed = true;
        ImageAnalysisResponse.data = result[0];
      }
      return ImageAnalysisResponse;
    }

  	private _getVideoAnalysis(result:any){
  		let processingResult = JSON.parse(result);
  		let expression:string;
  		let windowMeanScores:WindowMeanScores = new WindowMeanScores();
  		if(processingResult.fragments){
  			for(let fragment of processingResult.fragments){
  				this._addExpressionScoreFromFragmentEvent(windowMeanScores, fragment.events||[]);
  			}
  		}
  		return this._getExpressionAsPercentage(windowMeanScores);
  	}

  	private _addExpressionScoreFromFragmentEvent(windowMeanScores:WindowMeanScores, events:Array<any>){
  		for(let event of events){
  			if(event instanceof Array){
  				for(let score of event){  				
  					this._addWindowMeanScores(windowMeanScores, score.windowMeanScores);
  				}
  			}
		  }
  	}

    private _getExpressionAsPercentage(score:WindowMeanScores){
      let sumOfExpressions = score.anger + score.contempt + score.disgust + score.fear 
                    + score.happiness + score.neutral + score.sadness + score.surprise;
      score.anger = Math.round((score.anger/sumOfExpressions)*100);
      score.contempt = Math.round((score.contempt/sumOfExpressions)*100);
      score.disgust = Math.round((score.disgust/sumOfExpressions)*100);
      score.fear = Math.round((score.fear/sumOfExpressions)*100);
      score.happiness = Math.round((score.happiness/sumOfExpressions)*100);
      score.neutral = Math.round((score.neutral/sumOfExpressions)*100);
      score.sadness = Math.round((score.sadness/sumOfExpressions)*100);
      score.surprise = Math.round((score.surprise/sumOfExpressions)*100);
      return score;
    }

  	private _addWindowMeanScores(baseScore, newScore){
  		baseScore.anger = baseScore.anger + newScore.anger;
  		baseScore.contempt = baseScore.contempt + newScore.contempt;
  		baseScore.disgust = baseScore.disgust + newScore.disgust;
  		baseScore.fear = baseScore.fear + newScore.fear;
  		baseScore.happiness = baseScore.happiness + newScore.happiness;
  		baseScore.neutral = baseScore.neutral + newScore.neutral;
  		baseScore.sadness = baseScore.sadness + newScore.sadness;
  		baseScore.surprise = baseScore.surprise + newScore.surprise;
  	}

  	private _handleError (error: Response | any) {
		let errMsg: string;
		if (error instanceof Response) {
		  const body = error.json() || '';
		  const err = body.error || JSON.stringify(body);
		  errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
		} else {
		  errMsg = error.message ? error.message : error.toString();
		}
		console.error(errMsg);
		return Observable.throw("Unexpected service failure. Please try again later.");
	}

}
