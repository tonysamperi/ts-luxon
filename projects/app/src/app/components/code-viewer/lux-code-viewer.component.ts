import {Component, OnInit, ViewEncapsulation} from "@angular/core";
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
export class LuxCodeViewerComponent implements OnInit {

    showCode: boolean = !1;

    constructor() {
    }

    ngOnInit(): void {
        const $code = document.querySelector(`code`);
        if (!$code) {
            return;
        }
        Prism.highlightElement($code);
    }

}
