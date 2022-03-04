import Joi from "joi";

export default class Validator {
    static login(data) {
        const schema = Joi.object({
            username: Joi
                .string()
                .min(6)
                .max(32)
                .required(),
            password: Joi
                .string()
                .min(6)
                .required(),
        });
    
        return schema.validate(data);
    }
};