const path = require("path");
const _ = require("lodash");

const PACKAGE_BIN = "node_modules/.bin";
const SRC_DIR = "src";
const DIST_DIR = "build";

module.exports = function (grunt) {
  grunt.loadNpmTasks("grunt-shell");

  // Project configuration.
  grunt.initConfig({
    shell: {
      options: {
        stderr: true,
      },
      scan: {
        command: `grep -Hre "{{ [a-zA-Z0-9\._-]* }}" ./src/**/*.mjml | awk '\
        function findall(str, re) { \
            while(match(str, re)) { \
                print substr(str, RSTART, RLENGTH); \
                str = substr(str, RSTART + RLENGTH) \
            } \
        } \
        { \
            findall($0, "({{ [a-zA-Z0-9\._-]* }})"); \
        }' | sort | uniq`,
      },
      prepare: {
        command: [
          `echo cleaning build directory ${DIST_DIR}`,
          `rm -Rf ${DIST_DIR}`,
          `mkdir -p ${DIST_DIR}`,
        ].join(" && "),
      },
      mjml: {
        command: (edm) =>
          [
            `echo Compiling ${edm}.html`,
            `rm -f ${DIST_DIR}/${edm}.html`,
            `${PACKAGE_BIN}/mjml ${SRC_DIR}/${edm}.mjml -o ${DIST_DIR}/${edm}.html`,
          ].join(" && "),
      },
      localize: {
        command: (edm, language = "en") =>
          [
            `echo Localizing ${edm}.${language}.html`,
            `rm -f ${DIST_DIR}/${edm}.${language}.html`,
            `cp -fp ${DIST_DIR}/${edm}.html ${DIST_DIR}/${edm}.${language}.html`,
            `${PACKAGE_BIN}/template-file ${SRC_DIR}/${edm}.${language}.json ${DIST_DIR}/${edm}.${language}.html ${DIST_DIR}/`,
          ].join(" && "),
      },
      cleanup: {
        command: (edm) =>
          [
            `echo Deleting ${DIST_DIR}/${edm}.html`,
            `rm -f ${DIST_DIR}/${edm}.html`,
          ].join(" && "),
      },
    },
  });

  grunt.registerTask("compile", function (edm) {
    console.log("Compiling", edm);

    const files = grunt.file.expand({ cwd: "src" }, [`${edm}*.json`]);
    console.log("EDM localization files", files);

    const languages = _(files)
      .map(_.partial(_.replace, _, edm, ""))
      .map(_.partial(_.replace, _, ".json", ""))
      .map(_.partial(_.trim, _, "."))
      .value();
    console.log("EDM languages", languages);

    grunt.task.run([
      `shell:mjml:${edm}`,
      ..._.map(languages, (language) => `shell:localize:${edm}:${language}`),
      `shell:cleanup:${edm}`,
    ]);
  });

  grunt.registerTask("compile-all", "Compile all EDM templates", function () {
    // Fail task if "foo" task failed or never ran.
    grunt.task.requires("shell:prepare");

    const files = grunt.file.expand({ cwd: "src" }, ["*.mjml"]);
    console.log("EDM files", files);

    const edms = _(files).map(_.partial(_.replace, _, ".mjml", "")).value();
    console.log("EDM templates", edms);

    grunt.task.run(_.map(edms, (edm) => `compile:${edm}`));
  });

  grunt.registerTask("default", ["shell:prepare", "compile-all"]);
};
