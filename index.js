const Alexa = require('ask-sdk-core');
const axios = require('axios');
const cheerio = require('cheerio');

const LessonsTodayHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LessonsToday';
    },
    async handle(handlerInput){
        let url = "";
        
        if(handlerInput.requestEnvelope.request.intent.slots.day.value){
            let days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
            console.log(days);
            url = `https://schedulescrapper.herokuapp.com/?q=everyLesson&url=https://plan.elektronik.edu.pl/&d=${days.indexOf(handlerInput.requestEnvelope.request.intent.slots.day.value.toLowerCase())}&r=json&m=true&n=`;
        }
        else{
            let today = new Date().getDay();
            url = `https://schedulescrapper.herokuapp.com/?q=everyLesson&url=https://plan.elektronik.edu.pl/&d=${today}&r=json&m=true&n=`;
        }
        
        const cl = handlerInput.requestEnvelope.request.intent.slots.class.value;
        
        console.log(url+cl);
        let output;
        
        await axios.get(url+cl)
            .then(res => {
                const html = res.data;
                const $ = cheerio.load(html);
                output = JSON.parse($('body').html());
            })
            .catch(error => {
                console.log(error);
            })
            
        let subjects = []
        
        output.forEach((el, id) => {
            let dividedText = el["Lekcja"].split(" ");
            
            if(/[A-Z]+/.test(dividedText[1])){
                
                if(/.+\d\/\d/.test(dividedText[0])){
                    subjects.push(dividedText[0].split("-")[0]);
                }
                else{
                    subjects.push(dividedText[0]);
                }
            }
            else{
                if(/.+\d\/\d/.test(dividedText[1])){
                    subjects.push(dividedText[0] + " " + dividedText[1].split("-")[0]);
                }
                else{
                    subjects.push(dividedText[0] + " " + dividedText[1]);
                }
                
            }
        })
        
        const uniqueSubjects = [...new Set(subjects)]; 
        
        console.log(output)
        return handlerInput.responseBuilder.speak(uniqueSubjects.join(" , ")).getResponse();
    }
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Welcome to School Schedule.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Welcome to School Schedule.', speechText)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'Ask me what lessons certain class or teacher have.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Ask me what lessons certain class or teacher have.', speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Goodbye!', speechText)
      .withShouldEndSession(true)
      .getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I don\'t understand your command. Please say it again.')
      .reprompt('Sorry, I don\'t understand your command. Please say it again.')
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    // Any clean-up logic goes here.
    return handlerInput.responseBuilder.getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LessonsTodayHandler,
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler)
  .addErrorHandlers(ErrorHandler)
  .lambda();