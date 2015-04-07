#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define GREEN   "\x1b[32m"
#define YELLOW  "\x1b[33m"
#define BLUE    "\x1b[34m"
#define RESET   "\x1b[0m"

union Data {
	int num;
	char *name;
	struct Node *node;
};

struct Node {
	struct Link *outgoing;
	struct Link *incoming;
	int outgoing_len;
	int incoming_len;
	union Data data;
	char type;
};


struct Link {
	struct Node *source;
	struct Node *target;
	char relation;
	struct Node *custom;
};

void add_outgoing_link(struct Node *a, struct Link *l){
	a->outgoing_len += 1;
	if(a->outgoing_len == 1){
		a->outgoing[0] = *l;
	} else {
		a->outgoing = (struct Link *) realloc(a->outgoing, sizeof(struct Link) * a->outgoing_len);
		a->outgoing[a->outgoing_len - 1] = *l;
	}
};

void add_incoming_link(struct Node *a, struct Link *l){
	a->incoming_len += 1;
	if(a->incoming_len == 1){
		a->incoming[0] = *l;
	} else {
		a->incoming = (struct Link *) realloc(a->incoming, sizeof(struct Link) * a->incoming_len);
		a->incoming[a->incoming_len - 1] = *l;
	}
};

int compare(struct Node *a, struct Node *b){
	if(a->type != b->type){
		return 0;
	}
	else if(a->type == 's'){
		return strcmp(a->data.name, b->data.name) == 0 ? 1 : 0;
	} else {
		return a->data.num == b->data.num ? 1 : 0;
	}
};

int has_state_check(struct Node *a, struct Node *b){
	int state_found = 0;
	for(int i = 0; i < a->outgoing_len; i++){
		if(a->outgoing[i].relation == 'c'){
			state_found = has_state_check(a->outgoing[i].custom, b) || state_found;
		}
		else if(a->outgoing[i].relation != 'n'){
			int equal = compare(a->outgoing[i].target, b);
			if(equal == 1){
				state_found = 1;
			} else {
				state_found = has_state_check(a->outgoing[i].target, b) || state_found;
			}
		} 
	}
	// if(!state_found){
	// 	for(int j = 0; j < a->incoming_len; j++){
	// 		if(a->incoming[j].relation != 'n'){
	// 			int equal = compare(a->incoming[j].target, b);
	// 			if(equal == 1){
	// 				state_found = 1;
	// 			} else {
	// 				state_found = has_state_check(a->incoming[j].target, b) || state_found;
	// 			}
	// 		} 
	// 	}	
	// }
	return state_found;
};

void has_state(struct Node *a, struct Node *b){
	int has_state = has_state_check(a, b);
	if(a->type == 's'){
		if(has_state == 1){
			printf("Item "GREEN"%s"RESET" has state "BLUE"%s"RESET"\n", a->data.name, b->data.name);
		} else {
			printf("Item "GREEN"%s"RESET" doesn't have state "BLUE"%s"RESET"\n", a->data.name, b->data.name);
		}
	} else {
		if(has_state == 1){
			printf("Item "GREEN"%d"RESET" has state "BLUE"%d"RESET"\n", a->data.num, b->data.num);
		} else {
			printf("Item "GREEN"%d"RESET" doesn't have state "BLUE"%d"RESET"\n", a->data.num, b->data.num);
		}
	}
};

int check_custom_relation(struct Node *rel, struct Node *a, struct Node *b){
	int match = 0;
	int equal_a; int equal_b; int equal_c; int equal_d;

	for(int i = 0; i < rel->outgoing_len; i++){
		if(a->outgoing[i].relation != 'n'){
			equal_a = compare(rel->outgoing[i].target, a);
			equal_b = compare(rel->outgoing[i].source, b);
			equal_c = compare(rel->outgoing[i].target, b);
			equal_d = compare(rel->outgoing[i].source, a);
			match = (equal_a && equal_b) || (equal_c && equal_d) || match ? 1 : 0;
		}
	}
	return match;
}

void custom_relation(struct Node *rel, struct Node *a, struct Node *b){
	int match = check_custom_relation(rel, a, b);
	if(match){
		if(a->type == 's' || a->type == 'c'){
			printf("Item "GREEN"%s"RESET" and item "GREEN"%s"RESET" have relation "BLUE"%s"RESET"\n", a->data.name, b->data.name, rel->data.name);
		} else {
			printf("Item %d and item %d have relation %s\n", a->data.num, b->data.num, rel->data.name);	
		}
	} else {
		for(int j = 0; j < rel->incoming_len; j++){
			match = check_custom_relation(rel->incoming[j].source, a, b);
			if(match){
				printf("Item "GREEN"%s"RESET" and item "GREEN"%s"RESET" have relation "BLUE"%s"RESET" via relation "BLUE"%s"RESET"\n", a->data.name, b->data.name, rel->data.name, rel->incoming[j].source->data.name);
			}
		}
	}
}


// int not_has_state_check(struct Node *a, struct Node *b){
// 	for(int i = 0; i < a->link_len; i++){
// 		if(a->links[i].relation == 'n')	
// 	}
// };