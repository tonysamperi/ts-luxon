export class Invalid {

  private _formattedExplanation: string = "";

  constructor(public reason: string, public explanation?: string) {
    explanation && (this._formattedExplanation = `: ${explanation}`);
  }

  toMessage() {
    return `${this.reason}${this._formattedExplanation}`;
  }

}
