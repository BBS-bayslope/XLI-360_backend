import {
  from,
  popScheduler
} from "./chunk-XRHLE4CU.js";

// node_modules/rxjs/dist/esm5/internal/observable/of.js
function of() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  var scheduler = popScheduler(args);
  return from(args, scheduler);
}

export {
  of
};
//# sourceMappingURL=chunk-UGMZIGOT.js.map
