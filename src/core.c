struct Node {
	struct Link *links;
	int link_len;
	union Data data;
	char type;
}

union Data {
	int num;
	char *name;
	struct Node *node;
}

struct Link {
	struct Node *target;
	struct Node *destination;
	char *relation;
}

