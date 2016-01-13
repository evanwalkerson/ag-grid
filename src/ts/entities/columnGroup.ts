/// <reference path="./abstractColumn.ts"/>

module ag.grid {

    export class ColumnGroup extends ColumnGroupChild {

        // all the children of this group, regardless of whether they are opened or closed
        private children: ColumnGroupChild[];
        // depends on the open/closed state of the group, only displaying columns are stored here
        private displayedChildren: ColumnGroupChild[] = [];

        pinned: any;
        expandable = false;
        expanded = false;
        colGroupDef: ColGroupDef;

        constructor(pinned: any, colGroupDef: ColGroupDef) {
            this.pinned = pinned;
            this.colGroupDef = colGroupDef;
        }

        public isChildInThisGroupDeepSearch(wantedChild: ColumnGroupChild): boolean {
            var result = false;

            this.children.forEach( (foundChild: ColumnGroupChild) => {
                if (wantedChild === foundChild) {
                    result = true;
                }
                if (foundChild instanceof ColumnGroup) {
                    if ((<ColumnGroup>foundChild).isChildInThisGroupDeepSearch(wantedChild)) {
                        result = true;
                    }
                }
            });

            return result;
        }

        public getActualWidth(): number {
            var groupActualWidth = 0;
            if (this.displayedChildren) {
                this.displayedChildren.forEach( (child: ColumnGroupChild)=> {
                    groupActualWidth += child.getActualWidth();
                });
            }
            return groupActualWidth;
        }

        public getMinimumWidth(): number {
            var result = 0;
            this.displayedChildren.forEach( (groupChild: ColumnGroupChild) => {
                result += groupChild.getMinimumWidth();
            });
            return result;
        }

        public addChild(child: ColumnGroupChild): void {
            if (!this.children) {
                this.children = [];
            }
            this.children.push(child);
            this.calculateExpandable();
        }

        public getDisplayedChildren(): ColumnGroupChild[] {
            return this.displayedChildren;
        }

        public getDisplayedLeafColumns(): Column[] {
            var result: Column[] = [];
            this.addDisplayedLeafColumns(result);
            return result;
        }

        public getDefinition(): AbstractColDef {
            return this.colGroupDef;
        }

        private addDisplayedLeafColumns(leafColumns: Column[]): void {
            this.displayedChildren.forEach( (child: ColumnGroupChild) => {
                if (child instanceof Column) {
                    leafColumns.push(<Column>child);
                } else if (child instanceof ColumnGroup) {
                    (<ColumnGroup>child).addDisplayedLeafColumns(leafColumns);
                }
            });
        }

        public getChildren(): ColumnGroupChild[] {
            return this.children;
        }

        // need to check that this group has at least one col showing when both expanded and contracted.
        // if not, then we don't allow expanding and contracting on this group
        public calculateExpandable() {
            // want to make sure the group doesn't disappear when it's open
            var atLeastOneShowingWhenOpen = false;
            // want to make sure the group doesn't disappear when it's closed
            var atLeastOneShowingWhenClosed = false;
            // want to make sure the group has something to show / hide
            var atLeastOneChangeable = false;
            for (var i = 0, j = this.children.length; i < j; i++) {
                var abstractColumn = this.children[i];
                // if the abstractColumn is a grid generated group, there will be no colDef
                var headerGroupShow = abstractColumn.getDefinition() ? abstractColumn.getDefinition().columnGroupShow : null;
                if (headerGroupShow === 'open') {
                    atLeastOneShowingWhenOpen = true;
                    atLeastOneChangeable = true;
                } else if (headerGroupShow === 'closed') {
                    atLeastOneShowingWhenClosed = true;
                    atLeastOneChangeable = true;
                } else {
                    atLeastOneShowingWhenOpen = true;
                    atLeastOneShowingWhenClosed = true;
                }
            }

            this.expandable = atLeastOneShowingWhenOpen && atLeastOneShowingWhenClosed && atLeastOneChangeable;
        }

        public calculateDisplayedColumns() {
            // clear out last time we calculated
            this.displayedChildren = [];
            // it not expandable, everything is visible
            if (!this.expandable) {
                this.displayedChildren = this.children;
                return;
            }
            // and calculate again
            for (var i = 0, j = this.children.length; i < j; i++) {
                var abstractColumn = this.children[i];
                var headerGroupShow = abstractColumn.getDefinition() ? abstractColumn.getDefinition().columnGroupShow : null;
                switch (headerGroupShow) {
                    case 'open':
                        // when set to open, only show col if group is open
                        if (this.expanded) {
                            this.displayedChildren.push(abstractColumn);
                        }
                        break;
                    case 'closed':
                        // when set to open, only show col if group is open
                        if (!this.expanded) {
                            this.displayedChildren.push(abstractColumn);
                        }
                        break;
                    default:
                        // default is always show the column
                        this.displayedChildren.push(abstractColumn);
                        break;
                }
            }
        }
    }

}