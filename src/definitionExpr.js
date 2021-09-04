const definition_match_expr = ['(?<=(action|control|table|state)\\s+)[a-zA-Z0-9_]+(?=(\\s*[;(]?))',
                        '(?<=(#define\\s))[a-zA-Z0-9_]+',
                        '(?<=((int|bool|bit<.*>)\\s+))[a-zA-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*)?[;,\\)]))',
                        '(?<=((header|struct)\\s+))[a-zA-Z0-9_]+(?=(\\s*))',
                        '(?<=((Register|RegisterAction|Hash|Resubmit|Mirror|Counter|ActionSelector).*))\\s[a-zA-Z0-9_]+(?=(\\s*;))',
                        '(?<=([a-zA-Z0-9_]+(\\[[0-9]+\\])?\\s+))[a-zA-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*)?[;,\\)]))'];

exports.definition_match_expr = definition_match_expr;