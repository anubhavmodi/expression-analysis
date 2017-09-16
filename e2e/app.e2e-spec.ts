import { ExpressionCaptureAppPage } from './app.po';

describe('expression-capture-app App', () => {
  let page: ExpressionCaptureAppPage;

  beforeEach(() => {
    page = new ExpressionCaptureAppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
