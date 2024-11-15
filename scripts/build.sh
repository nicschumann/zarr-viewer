#!/bin/bash

esbuild src/index.html src/index.ts src/css/style.css \
  --bundle \
  --outdir=dist \
  --loader:.html=copy \
  --loader:.vert=text \
  --loader:.frag=text