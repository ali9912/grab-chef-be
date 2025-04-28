

export enum AchievementEnum {
    FOUR_STARS = 'fourStars',
    FIVE_STARS = 'fiveStars',
    ORDERS = 'orders',
}

export type Achievement = {
    type: AchievementEnum.ORDERS | AchievementEnum.FIVE_STARS | AchievementEnum.FOUR_STARS;
    qty: number
}

export interface Achievements extends Document {
    _id: string;
    label: string;
    image: string;
    conditions: Achievement[]
} 