# Environment Image
# Inherits from template base which has all system dependencies
# Workspace code, taskrunner, packages, and environment folders are git-tracked and mounted at runtime

FROM us-west1-docker.pkg.dev/proximal-core-0/environments/moviepy-template-base:latest

# Everything else is handled at runtime via git clone
# This keeps the image lean and allows instant code updates without rebuilds
