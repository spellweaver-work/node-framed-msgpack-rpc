{spawn, exec} = require 'child_process'
fs            = require 'fs'
path          = require 'path'

LIB = "lib/"

task 'build', 'build the whole jam', (cb) ->  
  console.log "Building"
  files = fs.readdirSync 'src'
  files = ('src/' + file for file in files when file.match(/\.iced$/))
  await clearLibJs defer()
  await runIced [ '-I', 'none', '-c', '-o', LIB ].concat(files), defer()
  await copyIcedRuntime defer()
  console.log "Done building."
  cb() if typeof cb is 'function'

runIced = (args, cb) ->
  proc =  spawn 'iced', args
  proc.stderr.on 'data', (buffer) -> console.log buffer.toString()
  proc.stdout.on 'data', (buffer) -> console.log buffer.toString().trim()
  await proc.on 'exit', defer status 
  process.exit(1) if status != 0
  cb()

clearLibJs = (cb) ->
  files = fs.readdirSync 'lib'
  files = ("lib/#{file}" for file in files when file.match(/\.js$/))
  fs.unlinkSync f for f in files
  cb()

task 'test', "run the test suite", (cb) ->
  await runIced [ "test/all.iced"], defer()
  cb() if typeof cb is 'function'

task 'vtest', "run the test suite, w/ verbosity", (cb) ->
  await runIced [ "test/all.iced", '-d'], defer()
  cb() if typeof cb is 'function'

copyIcedRuntime = (cb) ->
  base = require.resolve 'iced-coffee-script'
  dir = path.dirname base
  stem = 'iced.js'
  infile = path.join dir, stem
  outfile = path.join LIB, stem
  await fs.readFile infile, defer err, data
  ok = false
  if err
    console.log "Error reading #{infile}: #{err}"
  else
    await fs.writeFile outfile, data, defer err
    if err
      console.log "Error writing #{outfile}: #{err}"
    else
      ok = true
  cb ok
  
