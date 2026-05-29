export interface Issue {
     title: string;
     description: string;
     type: "bug" | "feature_request";
}


export interface IIssueQuery {
     sort?: "newest" | "oldest";
     type?: string;
     status?: string;
}

export interface IUpdateIssueInput {
     title?: string;
     description?: string;
     type?: string;
}