const buildSchema = require("./build.schema");

class Schema {
  schema;

  constructor(constraints) {
    this.schema = buildSchema(constraints);
  }

  validate(obj) {
    let dest;
    let err_stack = new Array();

    this.schema.forEach((field) => {
      let field_name = field.path[field.path.length - 1];
      dest = obj;

      field.path.forEach((node) => {
        try {
          dest = dest[node];
        } catch {
          throw new SchemaObjectMismatchError("SCHEMA_OBJECT_MISMATCH");
        }
      });

      Object.keys(field.validations).forEach((key) => {
        let _eval;

        if (key === "_isLeaf") return;

        if (typeof field.validations[key] === "function") {
          _eval = field.validations[key](dest);
          if (_eval) return;
          err_stack.push(`${key} validator deems the field ${field_name} invalid.`);
        } else if (typeof field.validations[key] === "object") {
          _eval = field.validations[key].validator(dest);
          if (_eval) return;
          let err_msg = field.validations[key].message;
          if (typeof err_msg === "undefined") err_stack.push(`${key} validator deems the field ${field_name} invalid.`);
          else if (typeof err_msg !== "function") err_stack.push(err_msg);
          else if (typeof err_msg === "function") err_stack.push(err_msg(field_name, key, dest));
        }
      });
    });

    if (err_stack.length === 0) return;
    
    const err = new ValidationError("VALIDATION_ERROR");
    err.errors = err_stack;

    throw err;
  }
}

class SchemaObjectMismatchError extends Error {

  constructor(message) {
    super(message);
    this.name = "SchemaObjectMismatchError";
  }  

}

class ValidationError extends Error {
  
  errors = [];

  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }

}

module.exports = Schema;
