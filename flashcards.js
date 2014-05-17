(function() {
    window.Flashcards = {
        define: function(data) {
            this.title = 'Flashcards JS';
            this.comparisons = data.comparisons;
            this.points = data.points;
            this.base = "";
            this.comparitor = "";
            this.questions = 3;
            this.correct = 0;
            this.incorrect = 0;
            this.currentQuestionNumber = 1;
            this.currentQuestionSample = {};
            this.headerDisplayed = false;
            this.errors = [];
            this.templates = {};
            this.body = null;

            var fields = [];
            _.each(this.comparisons, function(comparison) {
                fields = _.union(fields, _.values(comparison));
            });

            for (var i = 0, length = this.points.length; i < length; i++) {
                var pointOk = true;
                var field = "";
                var fieldLength = fields.length;
                for (var fieldIndex = 0; fieldIndex < fieldLength; fieldIndex++) {
                    field = fields[fieldIndex];
                    if (typeof(this.points[i][field]) === "undefined") {
                        pointOk = false;
                        break;
                    }
                }
                if (pointOk === false) {
                    var message = "The following data point: ";
                    message += JSON.stringify(this.points[i]);
                    message += " didn't have the field " + field;
                    this.errors.push({
                        "message": message
                    });
                    // TODO: Put the errors on the page, or in the console
                    //       for devs to deal with.
                }
            }
        },

        reset: function() {
            this.base = "";
            this.comparitor = "";
            this.correct = 0;
            this.incorrect = 0;
            this.currentQuestionNumber = 1;
            this.currentQuestionSample = {};
        },

        route: function() {
            this.reset();
            var hash = document.location.hash;
            if (hash !== "") {
                var parts = hash.substring(1).split("-");
                this.base = parts[0];
                this.comparitor = parts[1];
            }
        },

        compileTemplate: function(templateId) {
            var templateElement = $("script#" + templateId);
            if (templateElement.length > 0) {
                var templateContent = templateElement.html();
                this.templates[templateId] = _.template(templateContent);
            } else {
                console.log("Template not found: " + templateId);
            }
        },

        _displayQuestionArea: function() {
            if (this.base !== "" && this.comparitor !== "") {
                var titleElement = $(document).find('#comparison-title');
                var title = this.base + ' vs ' + this.comparitor;
                if (titleElement.length > 0) {
                    titleElement.html(title);
                } else {
                    this.body.append(
                        this.templates.quizTitle({'title':title})
                    );
                }

                var questionArea = $(document).find('#question-area');
                if (questionArea.length === 0) {
                    this.body.append(this.templates.questionArea());
                }
                this.setupQuestion();
            }
        },

        _displayHeader: function() {
            var body = $(document).find("body");
            body.append(this.templates.headerTemplate({
                'title':this.title,
                'comparisons':this.comparisons
            }));

            this.headerDisplayed = true;
            this.body = $(document).find("#main");
        },

        display: function() {
            this.route();
            if (!this.headerDisplayed) {
                this._displayHeader();
                if ("onhashchange" in window) {
                    window.onhashchange = $.proxy(this.display, this);
                }
            }

            this._displayQuestionArea();
        },

        setupQuestion: function() {
            var self = this;
            var allQuestions = _.map(this.points, function(point) {
                return {
                    'question':point[self.base], 
                    'answer':point[self.comparitor]
                };
            });
            this.currentQuestionSample = _.sample(allQuestions, 3);
            var question = this.templates.questionTemplate({
                'comparitor':this.comparitor,
                'question':this.currentQuestionSample[0].question
            });
            $(document).find("#question").html(question);

            var answers = $(document).find("#answers");
            answers.html("");
            var shuffledQuestions = _.shuffle(this.currentQuestionSample);
            answers.html(
                this.templates.answersTemplate({
                    'answers':shuffledQuestions
                })
            );

            $(document).find('#submit-answer').on(
                'click', $.proxy(this.answerQuestion, this)
            );
        },
        restart: function() {
            $(document).find("#question-area").remove();
            this.display();
            return false;
        },
        showFeedback: function(result) {
            var feedback = $(document).find("#immediate-feedback");
            if (result === true) {
                feedback.html('Correct');
                feedback.addClass('label-success');
            } else {
                feedback.html('Incorrect');
                feedback.addClass('label-danger');
            }
            feedback.fadeIn(2000, function() {
                feedback.fadeOut(1000, function() {
                    if (result === true) {
                        feedback.removeClass('label-succes');
                    } else {
                        feedback.removeClass('label-danger');
                    }
                });
            });
        },
        answerQuestion: function() {
            var x = $(document).find('#answers input:checked');
            if (x.length > 0) {
                this.currentQuestionNumber++;
                var answer = x.val();
                if (this.currentQuestionSample[0].answer === answer) {
                    // Correct!
                    this.correct++;
                    this.showFeedback(true);
                } else {
                    // Incorrect!
                    this.incorrect++;
                    this.showFeedback(false);
                }
            }
            if (this.currentQuestionNumber <= this.questions) {
                this.setupQuestion();
            } else {
                $(document).find("#question-area").html(
                    this.templates.resultsTemplate({
                        'correct':this.correct,
                        'numberOfQuestions':this.questions
                    })
                );
                $("#reset").on(
                    'click', $.proxy(this.restart, this)
                );
            }

            return false;
        }
    }
})();
