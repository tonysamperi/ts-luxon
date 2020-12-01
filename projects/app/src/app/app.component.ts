import { Component } from "@angular/core";
import { Title } from "@angular/platform-browser";
//
import { DateTime } from "ts-luxon";

interface Theme {
  description: string;
  value: string
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class DemoAppComponent {

  appName: string = "ts-luxon";
  examples: string[] = [
    DateTime.local().setZone("America/New_York").minus({ weeks: 1 }).endOf("day").toISO()
  ];
  githubLink: string = "https://github.com/tonysamperi/ts-luxon";
  selectedTheme: Theme;
  themes: Theme[] = [
    { value: "", description: "Light" },
    { value: "dark-theme", description: "Dark" }
  ];

  constructor(titleService: Title) {
    this.selectedTheme = this.themes[0];
    titleService.setTitle(this.appName);
  }

  updateTheme(theme: Theme): void {
    this.selectedTheme = theme;
    document.body.classList.toggle("dark-theme", !!theme.value);
  }

}
