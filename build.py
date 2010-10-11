#!/usr/bin/python
# -*- coding: utf-8 -*-

import re
import tempfile
import subprocess
from base64 import standard_b64encode as b64encode
import mimetypes
import sys

options = None

__get_compress_cache = {}


def get_compress(filename):
    if filename in __get_compress_cache:
        return __get_compress_cache[filename]

    print 'Reading', filename
    extension = '.' + filename.rpartition('.')[2]
    with open(filename, 'r') as input:
        with tempfile.NamedTemporaryFile(suffix=extension) as tmp:
            tmp.write(replace_all(input.read()))
            tmp.flush()
            ps = subprocess.Popen([options.yuicommand, '-v', tmp.name],
                stderr=sys.stderr, stdout=subprocess.PIPE)

            script_output = ps.stdout.read()

    __get_compress_cache[filename] = script_output
    return script_output


def replace_compress(content):
    pattern = '{{ compress (?P<src>.+?) }}'

    def replace_cb(match):
        return get_compress(match.group('src')).replace('\\', r'\\')
    return re.sub(pattern, replace_cb, content)


def replace_image(content):
    pattern = '{{ image (?P<src>.+?) }}'

    def replace_cb(match):
        src = match.group('src')
        with open(src, 'rb') as fp:
            content = b64encode(fp.read())
        type = mimetypes.guess_type(src)[0]
        return 'data:{0};base64,{1}'.format(type, content)
    return re.sub(pattern, replace_cb, content)


def replace_text(content):
    pattern = '{{ text (?P<src>.+?) }}'

    def replace_cb(match):
        src = match.group('src')
        with open(src, 'rb') as fp:
            content = fp.read()
        return replace_all(content)
    return re.sub(pattern, replace_cb, content)


def replace_all(content):
    content = replace_compress(content)
    content = replace_image(content)
    content = replace_text(content)
    return content


def compile_file(input, output):
    print 'Compile', input, 'to', output
    with output != '--' and open(output, 'w') or sys.stdout as output:
        with open(input, 'r') as input:
            input = input.read()
            output.write(replace_all(input))


def make_xpi():
    if system('test "{0}"'.format(options.jetpack)):
        print >>sys.stderr, 'Jetpack SDK not found'
        return

    print 'Mozilla JetPack XPI compilation'
    cpath = os.getcwd()
    system('mkdir -p tmp/lib')
    system('cp xpi/package.json xpi/README.md tmp')
    compile_file('xpi/jetpack_tpl.js', 'tmp/lib/main.js')
    cmd = 'cd {0} && source bin/activate && cd {1} && cfx xpi -p tmp'.format(
            options.jetpack, cpath)
    result = system(cmd)
    if result:
        system('cp tmp/package.json xpi')
        system(cmd)
    system('rm -r tmp')


def make_crx():
    print 'Chromium CRX compilation'
    compile_file('crx/chromium_tpl.js', 'nwmodder.crx.js')
    system('rm -f nwmodder.crx.zip')
    system('zip nwmodder.crx.zip nwmodder.crx.js icons/icon*')
    system('cd crx && zip ../nwmodder.crx.zip manifest.json')


def make_gm():
    print 'Greasemonkey compilation'
    compile_file('gm/greasemonkey_tpl.js', 'nwmodder.user.js')


def make_clean():
    system('rm -f nwmodder.user.js nwmodder.crx.zip nwmodder.crx.js '\
            'nwmodder.xpi')


if __name__ == '__main__':
    from optparse import OptionParser
    import os
    import tempfile
    from os import system

    usage = 'Usage: %prog [options] targets...'
    epilog = 'Targets are: all, clean, crx, xpi, gm'
    parser = OptionParser(usage=usage, epilog=epilog)
    parser.add_option('-y', '--yuicompressor',
        dest='yuicommand', default='yuicompressor',
        help='yuicompressor executable or command (default: %default)')
    parser.add_option('-j', '--jetpack',
        dest='jetpack', default='~/jetpack',
        help='jetpack sdk directory (default: %default)')

    options, args = parser.parse_args()

    if system('which "{0}" > /dev/null'.format(options.yuicommand)):
        print >>sys.stderr, 'YUI command not found'
        exit(1)

    if not args:
        parser.print_help(sys.stderr)
        exit(1)

    if 'all' in args:
        args.extend(('crx', 'gm', 'xpi'))
        args.remove('all')

    if 'gm' in args:
        args.insert(0, 'crx')

    done = []
    for arg in args:
        if arg in done:
            continue
        done.append(arg)
        print '─' * 50, 'target', arg
        try:
            locals()['make_' + arg]()
        except KeyError:
            print >>sys.stderr, 'No target {0}'.format(arg)



    #system('rm modder.crx.js')

    #system('cp -r greasemonkey/modder.user.js www')
    #system('cp -r nwmodder.xpi www')
    #system('cp -r icons/icon32.png www/favicon.ico')
    #system('rm -rf www/.*~')

    #system('lftp -c "connect ... && cd www/modder && mirror -R -v -e www ."')
