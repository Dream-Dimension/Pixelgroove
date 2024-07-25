
# P5Instance:

We needed to wrap the p5.js library because it has a few issues due to it not being designed
with JS modules in mind. 

The decision to go with the instance version causes issues: namely we need to wait for 
it's initialization that creates a "sketch" instance which we use all over the codebase.

This adds complexity by needing to check for it to not be undefined throughout the entire codebase.

-- Important (potential bug): 
There is also concern in the timing of binding the draw functions. It seems this can be finicky
and if bound at a later time it wont be recognized. Requires investigation. 


The idea behind going with the p5 instance version should be revaluated.  

The reasoning was being able to create multiple instances of p5.js for rendering multiple 
canvases and adding modularity. It is not clear whether the non-instance approach is
supported in a JS module based system.


### p5.sound:
p5.sound turned out to be tricker than anticipated and for the time being a workaround was
done by bringing the types into our codebase which is not ideal. Webkit plugins/pre-loader 
did not seem to solve the issue but saw reports online it can be made to work.

Without the workaround there are some static clases not recognized by TS out of the box,
namely FFT.


