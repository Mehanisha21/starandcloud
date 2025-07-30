import {
  __read,
  __spreadArray,
  argsOrArgArray,
  filter,
  not,
  raceWith
<<<<<<<< HEAD:frontend/.angular/cache/17.3.17/vite/deps/chunk-3IC3TJIP.js
} from "./chunk-7KAEC65U.js";
========
} from "./chunk-Z3472RUT.js";
>>>>>>>> 84d0bebfb36e334bf43d06dea021a6755d10c3e6:frontend/.angular/cache/17.3.17/vite/deps/chunk-YYIAQJVV.js

// node_modules/rxjs/dist/esm5/internal/operators/partition.js
function partition(predicate, thisArg) {
  return function(source) {
    return [filter(predicate, thisArg)(source), filter(not(predicate, thisArg))(source)];
  };
}

// node_modules/rxjs/dist/esm5/internal/operators/race.js
function race() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  return raceWith.apply(void 0, __spreadArray([], __read(argsOrArgArray(args))));
}

export {
  partition,
  race
};
<<<<<<<< HEAD:frontend/.angular/cache/17.3.17/vite/deps/chunk-3IC3TJIP.js
//# sourceMappingURL=chunk-3IC3TJIP.js.map
========
//# sourceMappingURL=chunk-YYIAQJVV.js.map
>>>>>>>> 84d0bebfb36e334bf43d06dea021a6755d10c3e6:frontend/.angular/cache/17.3.17/vite/deps/chunk-YYIAQJVV.js
