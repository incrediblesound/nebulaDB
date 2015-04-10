WangLang
========
A simple logical programming language that compiles to C.

Examples
--------
The basic pattern is like this:    
{state}{relation}{state}    

There are two basic relations:    
-> is a transitive equals    
-! means does not equal   

You can use a state as a relation like this:    
{state-relation}:{origin-state},{target-state}    

To query the program, start the line with a question mark. Here is a basic example:    
sally->person    
john->person    
sister->female    
sister:sally,john    
?sally->female    
?john->female    

> Item sally has state female    
> Item john doesn't have state female    

It is also possible to define a state as a combination of multiple states with the following pattern:    
{state_a} -> {state_b}^{state_c}    
This pattern means "state A is true when state B and state C are true"

Here is an example:    

boy->male^child    
father->male    
son->male    
john->child    
father:dave,john    
?john->boy    
?dave->boy    

> item john has state boy
> item dave doesn't have state boy
