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

struct Array {
	struct Node *outgoing;
	int outgoing_len;
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
			state_found = has_state_check(a->outgoing[i].custom, b) || compare(a->outgoing[i].custom, b) || state_found;
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

void add_to_array(struct Array *a, struct Node *b){
	a->outgoing_len += 1;
	if(a->outgoing_len == 1){
		a->outgoing[0] = *b;
	} else {
		a->outgoing = (struct Node *) realloc(a->outgoing, sizeof(struct Node) * a->outgoing_len);
		a->outgoing[a->outgoing_len - 1] = *b;
	}
};

void add_outgoing(struct Array *base, struct Node *target){
	add_to_array(base, target);
	if(target->type != 'h'){ // hubs are added with their outgoing nodes attached
		for(int i = 0; i < target->outgoing_len; i++){
			if(target->outgoing[i].relation == 'm'){ // multiple links add hubs
				add_to_array(base, target->outgoing[i].custom);
			} 
			else if(target->outgoing[i].relation == 'c'){ // custom links add custom nodes
				add_outgoing(base, target->outgoing[i].custom);	
			} 
			else if(target->outgoing[i].relation != 'n'){
				add_outgoing(base, target->outgoing[i].target);
			}
		}
	}
}

struct Array *compile_states(struct Node *node){
	struct Array *result = (struct Array *) malloc(sizeof(struct Array));
	result->outgoing_len = 0;
	result->outgoing = (struct Node *) malloc(sizeof(struct Node));
	add_outgoing(result, node);
	return result;
};

int deep_match(struct Node *a, struct Node *b){
	struct Array *origin_states = compile_states(a);
	struct Array *target_states = compile_states(b);
	int match = 0;
	int total_multiples = 0;
	int matched_multiples = 0;
	int indexed = 0;
	for(int i = 0; i < origin_states->outgoing_len; i++){
		for(int j = 0; j < target_states->outgoing_len; j++){
			if(target_states->outgoing[j].type == 'h'){
				if(!indexed){
					total_multiples += target_states->outgoing[j].outgoing_len;
				}
				for(int l = 0; l < target_states->outgoing[j].outgoing_len; l++){
					if(target_states->outgoing[j].outgoing[l].target->data.name != NULL){
						int has_match = compare(&origin_states->outgoing[i], target_states->outgoing[j].outgoing[l].target);
						if(has_match){
							matched_multiples += 1;
						}
						match = match || has_match;
					}
				}
			} else {
				match = match || compare(&origin_states->outgoing[i], &target_states->outgoing[j]);
			}
			if(j == target_states->outgoing_len -1){
				indexed = 1; // stop adding up type-multiple nodes after one cycle
			}
		}
	}
	free(origin_states);
	free(target_states);
	return match && (matched_multiples == total_multiples);
};

void has_state(struct Node *a, struct Node *b){
	int has_state = has_state_check(a, b);
	if(has_state == 0){
		has_state = deep_match(a, b);
	}
	printf("%d\n", has_state);
};

int custom_relation_match(struct Link *rel, struct Node *a, struct Node *b){
	int match = 0;
	int equal_a; int equal_b; int equal_c; int equal_d;

	equal_a = compare(rel->source, a);
	equal_b = compare(rel->target, b);
	match = (equal_a && equal_b) ? 1 : 0;
	return match;
}

int custom_relation(struct Node *rel, struct Node *a, struct Node *b){
	int match = 0;
	for(int i = 0; i < rel->incoming_len; i++){
		match = custom_relation_match(&rel->incoming[i], a, b) || match;
	}
	// used for logic like: bob doesn't have relation father with john but matches
	// because father equals dad and bob has relation dad with john
	// if(match != 1){
	// 	for(int j = 0; j < rel->outgoing_len; j++){
	// 		match = custom_relation(rel->outgoing[j].target, a, b);
	// 	}
	// }
	printf("%d\n", match);
	return match;
}

void all_relations(struct Node *a){
	printf("{");
	for(int i = 0; i < a->outgoing_len; i++){
		if(a->outgoing[i].relation == 'e'){
			printf("\"hasState\": \"%s\"", a->outgoing[i].target->data.name);
		}
		else if(a->outgoing[i].relation == 'c'){
			printf("\"%s\": \"%s\"", a->outgoing[i].custom->data.name, a->outgoing[i].target->data.name);
		}
		if(i < a->outgoing_len-1){
			printf(",");
		}
	}
	printf("}");
};

void all_outgoing_targets(struct Node *a){
	printf("[");
	for(int i = 0; i < a->outgoing_len; i++){
		if(a->outgoing[i].relation == 'e'){
			if(i != 0){
				printf(",");
			}
			printf("\"%s\"", a->outgoing[i].target->data.name);
		}
	}
	printf("]");
};

void custom_target(struct Node *a, struct Node *b){
	int match;
	for(int i = 0; i < b->incoming_len; i++){
		if(b->incoming[i].relation == 'c'){
			match = compare(b->incoming->source, a);
			if(match){
				printf("{\"%s\": \"%s\"}", b->data.name, b->incoming->target->data.name);
			}
		}
	}
}