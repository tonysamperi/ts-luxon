import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { LuxAppModule } from "./app/app.module";
import { LUX_ENVIRONMENT } from "./environments/environment";

if (LUX_ENVIRONMENT.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(LuxAppModule)
  .catch(err => console.error(err));
