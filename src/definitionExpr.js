//match a name
'([a-zA-Z_]([a-zA-Z0-9_])*)'

//match a not concern line
const anti_match_expr = ["\\btransition\\b",
                         "^\\/\\/",
                         "^\\/\\*"];
//match a include
const include_match_expr = ['(?<=(#include\\s+\\"))[a-zA-Z0-9_\\.]+(?=(\\"))']
//match a parser state
const state_match_expr = ['(?<=(state\\s+))[a-zA-Z0-9_]+(?=(\\s*[;(]?))'];
//match a table
const table_match_expr = ['(?<=(table\\s+))[a-zA-Z0-9_]+(?=(\\s*[;(]?))'];
//match a function
const function_match_expr = ['(?<=((action|control)\\s+))[a-zA-Z0-9_]+(?=(\\s*[;(]?))'];
//match a #define
const define_match_expr = ['(?<=(#define\\s+))[a-zA-Z0-9_]+'];
//match a sdk object
const sdk_obj_match_expr = ['(?<=(extern\\s+))[a-zA-Z0-9_]+'];
//match a sdk function name in a sdk object
const sdk_func_match_expr = ['[a-zA-Z0-9_]+(?=((<.*>)?\\(.*\\)\\s?;))'];
//match a variable name after a type name
const variable_match_expr = ['(?<=((int|bool|bit<.*>)\\s+))[a-zA-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*)?[;,\\)]))',
                             '(?<=([a-zA-Z0-9_]+(\\[[0-9]+\\])?\\s+))[a-zA-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*)?[;,\\)]))',
                             '(?<=([a-zA-Z0-9_]+(<.*>)?\\(.*\\)\\s+))[a-zA-Z0-9_]+(?=(\\s*[,;\\)]))'];
//match a structure name in its definition (first line)
const struct_match_expr = ['(?<=(struct\\s+))[a-zA-Z0-9_]+(?=(\\s*{*[^;]$))'];
//match a structure name in its definition (first line)
const header_match_expr = ['(?<=(header\\s+))[a-zA-Z0-9_]+(?=(\\s*{*[^;]$))'];
//match a enum name in its definition (first line)
const enum_match_expr = ['(?<=(enum\\s+))[a-zA-Z0-9_]+(?=(\\s*{*[^;]$))'];
//match a typedef name
const typedef_alias_match_expr = ['(?<=(\\btypedef\\s+[a-zA-Z0-9_<>]+\\s+))[a-zA-Z0-9_]+(?=(\\s*;))'];
//match a typedef type(origin type) name
const typedef_origin_match_expr = ['(?<=(\\btypedef\\s+))[a-zA-Z0-9_<>]+(?=(\\s+[a-zA-Z0-9_]+(\\s*;)))'];
//match a typename before a variable's definition
const variable_type_match_expr = ['(int|bool|bit<.*>)(?=(\\s+[a-zA-Z0-9_]+\\s*(\\=\\s*[a-zA-Z0-9_]+\\s*)?[;,\\)]))',
                                  '[a-zA-Z0-9_]+(?=((\\[[0-9]+\\])?\\s+[a-zA-Z0-9_]+\\s*(\\=\\s*[a-zA-Z0-9_]+\\s*)?[;,\\)]))',
                                  '(?<=(^\\s*))[a-zA-Z0-9_]+(?=((<.*>)?\\(.*\\)\\s+[a-zA-Z0-9_]+\\s*[;,\\)]))'];
//match a element in a enum structure
const enum_variable_match_expr = ['[A-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*,)?))'];
//match a value in a enum variable define
const enum_value_match_expr = ['(?<=([A-Z0-9_]+\\s*=\\s*))[0-9]+(?=(\\s*,?))'];

//match a variable name when using it
const reference_match_expr = ['\\b([a-zA-Z_]([a-zA-Z0-9_])*)(?=(\\.))',
                              '\\b([a-zA-Z_]([a-zA-Z0-9_])*)(?=((\\s*\\=\\s*[a-zA-Z0-9_]+)?[;]))',
                              '(?<=(\\s*\\=\\s*))([a-zA-Z_]([a-zA-Z0-9_])*)(?=([;\\)]))'];

exports.anti_exp = anti_match_expr;
exports.include_exp = include_match_expr;
exports.state_exp = state_match_expr;
exports.table_exp = table_match_expr;
exports.func_exp = function_match_expr;
exports.define_exp = define_match_expr;
exports.sdk_obj_exp = sdk_obj_match_expr;
exports.sdk_func_exp = sdk_func_match_expr;
exports.variable_exp = variable_match_expr;
exports.alias_exp = typedef_alias_match_expr;
exports.variable_type_exp = variable_type_match_expr;
exports.struct_exp = struct_match_expr;
exports.header_exp = header_match_expr;
exports.origin_exp = typedef_origin_match_expr;
exports.enum_exp = enum_match_expr;
exports.enum_variable_exp = enum_variable_match_expr;
exports.enum_value_exp = enum_value_match_expr;

exports.ref_exp = reference_match_expr;