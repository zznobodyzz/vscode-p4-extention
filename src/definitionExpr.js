const funtion_match_expr = ['(?<=(action|control|table|state)\\s+)[a-zA-Z0-9_]+(?=(\\s*[;(]?))'];
const define_match_expr = ['(?<=(#define\\s))[a-zA-Z0-9_]+'];
const inline_element_match_expr = ['(?<=((Register|RegisterAction|Hash|Resubmit|Mirror|Counter|ActionSelector).*))\\s[a-zA-Z0-9_]+(?=(\\s*;))'];
const variable_match_expr = ['(?<=((int|bool|bit<.*>)\\s+))[a-zA-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*)?[;,\\)]))',
                            '(?<=([a-zA-Z0-9_]+(\\[[0-9]+\\])?\\s+))[a-zA-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*)?[;,\\)]))',
                            '(?<=((header|struct)\\s+[a-zA-Z0-9_]+\\s+))[a-zA-Z0-9_]+(?=(\\s*))'];
//typedef struct aaa 'bbb'
//typedef int 'aaa'
//'struct aaa'
//'header bbb'
const define_type_match_expr = ['\\b(struct|header)\\s+[a-zA-Z0-9_]+(?=([^;]$))',
                                '(?<=(\\btypedef\\s+(struct|header)\\s+[a-zA-Z0-9_]+\\s+))[a-zA-Z0-9_]+'];

const type_match_expr = ['(?<=(\\btypedef\\s+(struct|header)\\s+[a-zA-Z0-9_]+\\s+))[a-zA-Z0-9_]+',
                        '(?<=(\\btypedef\\s+[a-zA-Z0-9_<>]+\\s+))[a-zA-Z0-9_]+(?=(\\s*;))',
                        '\\b(struct|header)\\s+[a-zA-Z0-9_]+',
                        '\\b(int|bool|bit<.*>)(?=(\\s+[a-zA-Z0-9_]+))'];

//typedef 'struct aaa' bbb
//typedef 'int' aaa
const typedef_match_expr = ['(?<=(\\btypedef\\s+))(struct|header)\\s+[a-zA-Z0-9_<>]+',
                            '(?<=(\\btypedef\\s+))[a-zA-Z0-9_<>]+(?=(\\s+[a-zA-Z0-9_<>]+))'];

//'struct aaa' bbb;
//'header aaa' bbb;
//'xxx_t' aaa;
//'xxx_t' bbb,
const vtype_match_expr = ['\\b(struct|header)\\s+[a-zA-Z0-9_]+(?=(\\s+)[a-zA-Z0-9_]+\\s*[;|,])',
                          '\\b[a-zA-Z0-9_]+(?=((\\[[0-9]+\\])?\\s+[a-zA-Z0-9_]+(\\s*[;,])))',
                          '\\b(int|bool|bit<.*>)(?=(\\s+[a-zA-Z0-9_]+\\s*[;,]))'];

const definition_match_expr = funtion_match_expr.concat(define_match_expr).concat(inline_element_match_expr).concat(variable_match_expr);

exports.definition_match_expr = definition_match_expr;
exports.type_match_expr = type_match_expr;
exports.variable_match_expr = variable_match_expr;
exports.typedef_match_expr = typedef_match_expr;
exports.vtype_match_expr = vtype_match_expr;
exports.define_type_match_expr = define_type_match_expr;