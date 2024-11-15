#!/bin/bash

./build.sh

esbuild src/index.html src/index.ts src/css/style.css \
  --bundle \
  --watch \
  --outdir=dist \
  --servedir=dist \
  --loader:.html=copy \
  --loader:.vert=text \
  --loader:.frag=text \
  --inject:src/livereload.js