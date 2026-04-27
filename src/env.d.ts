/// <reference path="../worker-configuration.d.ts" />

declare namespace App {
  interface Locals extends Runtime {
    accessUser?: {
      email: string;
      sub: string;
    };
  }
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;
