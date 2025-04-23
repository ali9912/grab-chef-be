import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { AchievementEnum } from "../interfaces/achievement.interface";
import { Type } from "class-transformer";


export class CreateAchievementDto {
    @IsString()
    @IsNotEmpty()
    label: string;

    @IsArray()
    @ArrayNotEmpty() 
    @ValidateNested({ each: true })
    @Type(() => ConditionDto) 
    conditions: [ConditionDto]
}

export class ConditionDto {

    @IsString()
    @IsEnum(AchievementEnum)
    type: string


    @IsNumber()
    @IsNotEmpty()
    qty: number
}