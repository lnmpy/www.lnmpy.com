#!/usr/bin/python

import os
import jinja2
import glob
import codecs

INDEX_FILE = "index.html"
TEMPLATE_FILE = "_.html"
PARSER_FILE = __file__


def get_token(token_str, d, token_name):
    d[token_name] = token_str.split('@' + token_name)[1].strip().decode('utf8')


def get_file_info(file_name, modify_version=False):
    lines = open(file_name).readlines()
    d = {"url": file_name}
    for num, line in enumerate(lines):
        if '@name ' in line:
            get_token(line, d, 'name')
        elif '@match' in line:
            get_token(line, d, 'match')
        elif '@description' in line:
            get_token(line, d, 'description')
        elif '@version' in line:
            get_token(line, d, 'version')
            if modify_version:
                d['version'] = float(d['version']) + 0.1
                lines[num] = "// @version     %.1f\n" % d['version']
    open(file_name, 'w').writelines(lines)
    return d

template_file = open(TEMPLATE_FILE)
index_file = codecs.open(INDEX_FILE, "w", "utf-8")
template_obj = jinja2.Template(template_file.read())


l = []
modified_files = [f.strip() for f in os.popen('git status | grep modified | grep -o "[a-zA-Z0-9_.]*.user.js"').readlines()]
files = glob.glob('*.user.js')
for f in files:
    meta_info = get_file_info(f, f in modified_files)
    l.append(meta_info)

index_file.write(template_obj.render({"metas": l}))
index_file.close()

os.system('git commit *.user.js %s -m "update monkey scripts" ' % INDEX_FILE)
os.system('git push')
