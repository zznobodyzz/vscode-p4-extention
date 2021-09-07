//match a function
const funtion_match_expr = ['(?<=(action|control|table|state)\\s+)[a-zA-Z0-9_]+(?=(\\s*[;(]?))'];
//match a #define
const define_match_expr = ['(?<=(#define\\s+))[a-zA-Z0-9_]+'];
//match a sdk element
const sdk_element_match_expr = ['(?<=(extern\\s+))[a-zA-Z0-9_]+'];
//match a variable name after a type name
const variable_match_expr = ['(?<=((int|bool|bit<.*>)\\s+))[a-zA-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*)?[;,\\)]))',
                             '(?<=([a-zA-Z0-9_]+(\\[[0-9]+\\])?\\s+))[a-zA-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*)?[;,\\)]))',
                             '(?<=((Register|RegisterAction|Hash|Resubmit|Mirror|Counter|ActionSelector).*))\\s[a-zA-Z0-9_]+(?=(\\s*;))'];
//match a type name in its definition (first line)
const type_match_expr = ['(?<=(struct|header|enum)\\s+)[a-zA-Z0-9_]+(?=(\\s*{*[^;]$))'];
//match a typedef name
const typedef_match_expr = ['(?<=(\\btypedef\\s+[a-zA-Z0-9_<>]+\\s+))[a-zA-Z0-9_]+(?=(\\s*;))'];
//match a typedef type(origin type) name
const typedef_type_match_expr = ['(?<=(\\btypedef\\s+))[a-zA-Z0-9_<>]+(?=(\\s+[a-zA-Z0-9_]+(\\s*;)))'];
//match a typename before a variable's definition
const variable_type_match_expr = ['\\b[a-zA-Z0-9_]+(?=((\\[[0-9]+\\])?\\s+[a-zA-Z0-9_]+\\s*[;,]))',
                                  '\\b(int|bool|bit<.*>)(?=(\\s+[a-zA-Z0-9_]+\\s*[;,]))'];
const enum_variable_match_expr = ['[A-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*,)?))'];

const definition_match_expr = funtion_match_expr.concat(define_match_expr).concat(sdk_element_match_expr).concat(variable_match_expr).concat(typedef_match_expr).concat(type_match_expr);

exports.d_exp = definition_match_expr;
exports.v_exp = variable_match_expr;
exports.td_exp = typedef_match_expr;
exports.vt_exp = variable_type_match_expr;
exports.t_exp = type_match_expr;
exports.tdt_exp = typedef_type_match_expr;
exports.ev_exp = enum_variable_match_expr;