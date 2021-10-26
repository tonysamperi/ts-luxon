import {AfterViewInit, Component, ElementRef, HostBinding, ViewEncapsulation} from "@angular/core";
//
import * as Prism from "prismjs";

@Component({
    // tslint:disable-next-line:component-selector
    selector: "lux-code-viewer",
    templateUrl: "lux-code-viewer.component.html",
    styleUrls: ["lux-code-viewer.component.scss"],
    encapsulation: ViewEncapsulation.None
})
// tslint:disable-next-line:naming-convention
export class LuxCodeViewerComponent implements AfterViewInit {

    @HostBinding("class.lux-code-viewer") hostKlass: boolean = !0;
    showCode: boolean = !1;

    constructor(protected _elRef: ElementRef) {
    }

    ngAfterViewInit(): void {
        const $code = this._elRef.nativeElement.querySelector(`code`);
        if (!$code) {
            return console.error("CODE NOT FOUND!!", $code);
        }
        Prism.highlightElement($code);
    }

}
