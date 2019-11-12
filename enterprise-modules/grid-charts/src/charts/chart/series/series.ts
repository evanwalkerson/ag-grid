import { Group } from "../../scene/group";
import { LegendDatum } from "../legend";
import { Shape } from "../../scene/shape/shape";
import { Observable, reactive } from "../../util/observable";
import { ChartAxisDirection } from "../chartAxis";

/**
 * `D` - raw series datum, an element in the {@link Series.data} array.
 * `SeriesNodeDatum` - processed series datum used in node selections,
 *                     contains information used to render pie sectors, bars, line markers, etc.
 */
export interface SeriesNodeDatum {
    seriesDatum: any;
}

export interface TooltipRendererParams {
    datum: any;
    title?: string;
    color?: string;
}

export interface CartesianTooltipRendererParams extends TooltipRendererParams {
    xKey: string;
    xName?: string;

    yKey: string;
    yName?: string;
}

export interface PolarTooltipRendererParams extends TooltipRendererParams {
    angleKey: string;
    angleName?: string;

    radiusKey?: string;
    radiusName?: string;
}

export interface HighlightStyle {
    fill?: string;
    stroke?: string;
}

export abstract class Series extends Observable {

    readonly id: string = this.createId();

    /**
     * The group node that contains all the nodes used to render this series.
     */
    readonly group: Group = new Group();

    tooltipEnabled: boolean = false;

    @reactive(['dataChange']) data: any[] = [];
    // @reactive(['dataChange']) chart?: C;
    @reactive(['dataChange']) visible = true;
    @reactive(['layoutChange']) showInLegend = true;

    directions: ChartAxisDirection[];

    directionKeys: { [key in ChartAxisDirection]?: string[] };

    /**
     * Returns the actual keys used (to fetch the values from `data` items) for the given direction.
     */
    getKeys(direction: ChartAxisDirection): string[] {
        const { directionKeys } = this;
        const keys = directionKeys && directionKeys[direction];
        const values: string[] = [];

        if (keys) {
            keys.forEach(key => {
                const value = (this as any)[key];

                if (value) {
                    if (Array.isArray(value)) {
                        values.push(...value);
                    } else {
                        values.push(value);
                    }
                }
            });
        }

        return values;
    }

    private createId(): string {
        const constructor = this.constructor as any;
        const className = constructor.className;
        if (!className) {
            throw new Error(`The ${constructor} is missing the 'className' property.`);
        }
        return className + '-' + (constructor.id = (constructor.id || 0) + 1);
    }

    abstract getDomain(direction: ChartAxisDirection): any[];

    abstract processData(): boolean;
    abstract update(): void;

    abstract getTooltipHtml(nodeDatum: SeriesNodeDatum): string;

    /**
     * @private
     * Populates the given {@param data} array with the items of this series
     * that should be shown in the legend. It's up to the series to determine
     * what is considered an item. An item could be the series itself or some
     * part of the series.
     * @param data
     */
    abstract listSeriesItems(data: LegendDatum[]): void;

    toggleSeriesItem(itemId: any, enabled: boolean): void {
        this.visible = enabled;
    }

    abstract highlightNode(node: Shape): void;
    abstract dehighlightNode(): void;

    readonly scheduleLayout = () => {
        this.fireEvent({type: 'layoutChange'});
    }

    readonly scheduleData = () => {
        this.fireEvent({type: 'dataChange'});
    }
}
