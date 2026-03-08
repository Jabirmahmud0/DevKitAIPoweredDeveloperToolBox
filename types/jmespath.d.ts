declare module "jmespath" {
    interface JMESPathOptions {
        customFunctions?: Record<string, (...args: any[]) => any>;
    }

    interface JMESPath {
        (data: any, expression: string, options?: JMESPathOptions): any;
        search: (data: any, expression: string, options?: JMESPathOptions) => any;
        compile: (expression: string) => { search: (data: any, options?: JMESPathOptions) => any };
        tokenize: (expression: string) => any;
    }

    const jmespath: JMESPath;
    export default jmespath;
    export { jmespath };
}
