# Coding Guidelines

Welcome to our project! This document outlines the coding standards and best practices .

## Table of Contents
- [General Principles](#general-principles)
- [Errors and Exceptions](#exceptions)
- [Comments](#comments)

## General Principles
Mostly based on principles behind books like **A Philosophy of Software Design** and **Clean Code**.
- Reduce complexity by making code easier to read and modify
- Want to reduce number of dependencies between modules
- Aim  to come up with more than one design when thinking of a module / class
- Deep modules with shallow interfaces
- Use some design patterns and favor composition over inheritance:
  - Factory Pattern 
  - Strategy Pattern / Behaviors
  - Observer Pattern
  - Adapter Pattern
  - Command Pattern (redo/undo)
- Avoid passthrough methods
- Boyscouts rules: leave it a little better than found it / Broken window principle
- 20% investment little by little in Code Quality. Pays dividens in long run (6-12months out)
- Tech debt is similar to business debt, some it makes sense to take, try to approach it from:
  a perspective of "bad debt" vs "reasonable debt".

## Erros and Exceptions
The ideal approach would be to get rid of exceptions all together but the main approaches will be:

1) Reduce exceptions
Goals is to have clients not have to deal with this at all, so as to reduce the interface and make
modules deeper.
e.g: string class that allows selection but if user goes out of bounds it clamps for them 
2) Mask Exceptions:
- At the lower level handle the exceptions yourself. It can be complicated but best suited for library code 
that many other methods will be using. 
3) Handle in one Place (Aggregate): 
- In some cases it might make more sense to aggregate all exceptions and handle them at a higher level
instead of at lower levels of a module. This will ensure no similar special code is written all throughout
for the same type of exceptions.  This is the opposite of Masking Exceptions. It will be a judgement call
when to use which approach.
4) Let it crash
In certain cases it is best just to let the system crash instead of trying to recover by hand.
E.g when you run out of memory. 


### Key Points:
- Decide what matters and what doesn't. Don't take it too far, sometimes you need exceptions/errors.
-Someone has to handle the exception one way or another. 
- Exceptions are good for when you need to bubble
up multiple levels. 
- Error codes can be good if handled just one level above.
- Second error exception handling code (code that handles exceptions thrown by exception handling code)
can compound.
- Exception handling code can be hard to test well. Some exceptions are hard to reproduce.
- Don't just throw exceptions willy nilly. Someone has to handle them at one point.


## Comments
Comments should not repeat what the code does. If a user can read the code and come up with the comment it's probably a bad comment (especially pertaining to implementation).

We use two type of comments:
1) Interface Comments
2) Implementation clarification comments


### Interface Comments

Interface comments provide an overview of the ideas behind a module. What is important for the user / client to know without providing unnecessary details. Helping combat Unknown unknowns and cognitive load.

Cross module comments can be added to the  [Global Comments File](./GLOBAL_COMMENTS.md) inside their corresponding section and be referenced from the corresponding module.

The ideal is to provide comments to go along with an interface. Comments are part of the abstraction.

If you want code that presents good abstractions, you must document those abstractions with comments.

Interface comments provide information that someone needs to know in order to use a class or method; they define the abstraction.

Comments can identify preconditions and post conditions.

If interface comments must also describe the implementation, then the class or method is shallow.

Comments describe the limitations of the class (it does not support concurrent access from multiple threads), which may be important to developers contemplating whether to use it.

### Local Coments:

- When commenting variables, try to use nouns instead of verbs.

- Most local variables don’t need documentation if they have good names.

Implementation details should not repeat the code but help clarify tricky logic.

### More Key points:
 Great software design requires stepping back from the detail and think about system at a higher level.

 Being able to think about which aspects of a system are most important and being able to ignore low-level details and think only in terms of its most fundamental characteristics (the essence of abstraction  = finding a simple way to think about a complex entity).

 Good high level comment: expresses one or few simple ideas that provide a conceptual framework.

 DRY: avoid duplication of documentation, will make it hard to maintain.
 
 Comments of the form “how we get here” are very useful for helping people to understand code.

E.g: when documenting a method, it can be very helpful to describe the conditions under which the method is most likely to be invoked (especially if the method is only invoked in unusual situations).

# Naming

Death by a thousand cuts:
- one bad variable name is not a big deal but there are so many names in a codebase that they all up and contribute to complexity
- Avoid extra words that add no useful info.
- Avoid vaguge names, can add to bugs and cause confusing.
- Be consistent. Helps readers reduce cognitive load.
- If a name is difficult to come up with perhaps too many ideas in one variable and may be a sign to rethink design.
- Avoid putting type in name (use IDE and type system for that) and remove redudant info (e.g if variable within Video Class, don't put videoDuratio
n, can use duration). 
- Just as important to think about what a variable represents as what it does not.
