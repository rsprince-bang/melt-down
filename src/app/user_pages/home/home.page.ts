import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalServicesService } from 'src/app/services/global-services.service';
import { ApiCallService } from 'src/app/services/api-call.service';
import { FoodSuggestionsService } from 'src/app/services/food-suggestions.service';

import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { Label } from 'ng2-charts';
import { reduce } from 'rxjs/operators';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {

  day = null;
  date = null;
  dayNumber = null;
  planLength_weeks = null;
  planLength_days = null;
  warnText= {proteinText:"...", carbsText:"...", fatText:"..."};
  segment_choice = 'nutrition';
  dailyCaloriesIntake = null;
  dietCaloriesIntake = null;
  caloriesConsumed: number = 0;
  caloriesFromProteinAsP: number = 0;
  caloriesFromCarbsAsP: number = 0;
  caloriesFromFatAsP: number = 0;
  warnCaloriesFromProteinAsP: number = 0;
  warnCaloriesFromCarbsAsP: number = 0;
  warnCaloriesFromFatAsP: number = 0;
  meals = [];
  exercises = [];
  workout_completed = false;
  workout_completed_msn ="";
  percent: number = 0;
  circlesubtitle = "";
  circlecolor = "#2b2b2b"; //gray atr first
  dayNutritionInfo = { "phase": null, "phaseday": null,"phasename":null , "daynutrition": { "protein": null, "carbs": null, "fat": null } }
  score:number = 0;
  progressPercentage = 0;
  
  //declare barcharts
  public barChartOptions: ChartOptions = {
    responsive: true,
    tooltips: {enabled: false},
    hover: {mode: null},
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
          min: 0,
          display: false
        },
        gridLines: {
          display: false
        }
      }],
      xAxes: [{
        gridLines: {
          display: false
        }
      }]
    },
    plugins: {
      datalabels: {
        anchor: 'center',
        clamp : true,
        offset: 0,
        font: {
          size: this.chartOptionsfontSize(),
          weight:900,
          
        }
      }
    }
  };
  public barChartLabels: Label[] = ['protein', 'carbs', 'fat'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartPlugins = [pluginDataLabels];

  public barChartData: ChartDataSets[] = [
    { data: [1, 2, 3], label: 'Grams consumed', backgroundColor: "rgb(56, 129, 255)" },
    { data: [4, 5, 6], label: 'Limit', backgroundColor: "rgb(191, 191, 191)"}
  ];




  constructor(private router: Router, private globalServices: GlobalServicesService, private activatedRoute: ActivatedRoute, private myAPI: ApiCallService,
    private foodSuggestionsService: FoodSuggestionsService, private alertController: AlertController) {

  }

  ngOnInit() {
    this.day = this.activatedRoute.snapshot.paramMap.get('day');
    this.date = this.globalServices.getDate(this.day);

    if (!this.globalServices.hasDailyCaloriesIntake()) {
      this.router.navigateByUrl("/enter-measurements");
    }
    
  }
  ionViewWillEnter() {
    this.updatepage();
    this.getFeedback();
  }



  handleSwipeLeft() {
    switch (this.day) {
      case "yesterday": {
        this.globalServices.swipeLeft("/home/today");
        break;
      }
      case "today": {
        this.globalServices.swipeLeft("/home/tomorrow");
        break;
      }
      default: {
       // cant swipe after tomorrow 
        break;
      }
    }
  }

  handleSwipeRight() {
    switch (this.day) {
      case "today": {
        if (this.dayNumber > 1) {
          //if its not your first day, then you can see previous day
          this.globalServices.swipeRight("/home/yesterday");
        }
        break;
      }
      case "tomorrow": {
        this.globalServices.swipeRight("/home/today");
        break;
      }
      default: {
        //cant swipe before yesterday 
        break;
      }
    }
  }

  doRefresh(event) {
    this.updatepage();
    event.target.complete();
  }

  updatepage() {
    this.dayNumber = this.foodSuggestionsService.getDietDayNumber(this.date);
    this.planLength_weeks = this.foodSuggestionsService.getDietPlanWeeks();
    this.planLength_days = this.planLength_weeks * 7;
    this.dayNutritionInfo = this.foodSuggestionsService.getDietDayDescription(this.date, this.planLength_weeks);

    this.barChartLabels = ['Protein '+this.dayNutritionInfo.daynutrition.protein +'%', 'Carbs '+this.dayNutritionInfo.daynutrition.carbs+'%', 'Fat '+ this.daynutritionOfFat()];
    this.myAPI.makeAPIcall(
      "meals.php",
      {
        "action": "getDayInfo",
        "date": this.date
      },
      true
    ).subscribe((result) => {
      if (result.error) {
        this.myAPI.handleMyAPIError(result.error);
      }
      else {
        this.meals = result.success.dayInfo.meals;
        this.exercises = result.success.dayInfo.exercises;
        this.workout_completed = this.foodSuggestionsService.getWorkoutStatus(this.exercises);
        this.workoutCompleted();
        this.calculateCaloriesConsumed();
      }
    });

    this.progressPercentage = this.calculateDayCompletionPercentage();

  }

  calculateCaloriesConsumed() {
    var info = this.foodSuggestionsService.getCaloriesPercentages(this.date, this.meals, this.exercises, this.planLength_weeks);

    this.barChartData[0].data = [Math.round(info.caloriesFromProtein), Math.round(info.caloriesFromCarbs), Math.round(info.caloriesFromFat)];
    this.barChartData[1].data = [Math.round(info.targetCaloriesFromProtein), Math.round(info.targetCaloriesFromCarbs), Math.round(info.targetCaloriesFromFat)];

    this.caloriesConsumed = info.caloriesConsumed;
    this.caloriesFromProteinAsP = info.caloriesFromProteinAsP;
    this.caloriesFromCarbsAsP = info.caloriesFromCarbsAsP;
    this.caloriesFromFatAsP = info.caloriesFromFatAsP;
    this.dietCaloriesIntake = info.dietCaloriesIntake;
    this.percent = info.percent;


    this.warnText.proteinText = this.warnTextFunction(info.targetCaloriesFromProtein, info.caloriesFromProtein );
    this.warnText.carbsText = this.warnTextFunction(info.targetCaloriesFromCarbs, info.caloriesFromCarbs);
    this.warnText.fatText = this.warnTextFunction(info.targetCaloriesFromFat, info.caloriesFromFat);

    if (info.color == "red") {
      this.circlecolor = "#CA1616";
    }
    else {
      this.circlecolor = "rgb(56, 129, 255"; 
    }
    this.circlesubtitle = this.caloriesConsumed + "/" + this.dietCaloriesIntake;

    //this.score = this.foodSuggestionsService.getScore(this.caloriesConsumed, this.dietCaloriesIntake, this.workout_completed, info.color, this.percent);
  
  }

  workoutCompleted(){
    if(this.workout_completed){
      this.workout_completed_msn = " Workout Completed";
    }else{
      this.workout_completed_msn = "Need Workout";
    }

  }

  warnTextFunction( target, current){
    var text = '';
    var difference = Math.floor(target - current);
    
    if( target > current && this.caloriesConsumed > this.dietCaloriesIntake ){
      text = "missing " + difference + " Calories";
    }
    else if(target > current){
      text = "need " + difference + " Calories";
    }
    else if( target < current ){
      text = "consumed too much " + difference + " Calories";
    }
    return text;  
  }

  daynutritionOfFat(){
    var text = null;

    if (this.dayNutritionInfo.daynutrition.fat == undefined){
        text = '5%'
    }else {
      text = this.dayNutritionInfo.daynutrition.fat + '%'
    }
    return text;
  } 

  chartOptionsfontSize(){
    var windowSize = window.matchMedia('(min-width: 700px)')
    var fontSize = null;

    if (windowSize.matches){
        fontSize = 16;
    }else {
      fontSize = 11;
    }
    return fontSize;
  }

  getFeedback(){
    //this.dayNumber is stored in lcoal storage so it will be available at the time this functino gets called 

    if( this.dayNumber > 7 ){
      var current_week = Math.ceil( this.dayNumber / 7 );
      var lastFeedback = parseInt(localStorage.getItem("lastFeedback"));

      //after first week reduce calories by 200
      if( Number.isNaN(lastFeedback) ){
        this.updateFeedback('no', 2);
      }
      //every week after that ask if happy
      else if( lastFeedback < current_week ){
        this.showFeedbackConfirm(current_week);
      }
    }

  }

  async showFeedbackConfirm(current_week) {
    const alert = await this.alertController.create({
      header: 'Confirm',
      message: 'Are you happy with your progress so far?',
      buttons: [
        {
            text: 'Yes',
            handler: () => {
              this.updateFeedback('yes', current_week);
            }
        },
        {
            text: 'No',
            handler: () => {
              this.updateFeedback('no', current_week);
            }
        }
    ]
    });
    await alert.present();
  }

  updateFeedback(feedback, weeknum){
    this.myAPI.makeAPIcall(
      "users.php", 
      {
        "action": "updateFeedback",
        "feedback": feedback,
        "weeknum": weeknum
      },
      true
    )
    .subscribe((result) => {
      if (result.error) {
        this.myAPI.handleMyAPIError(result.error);
      }
      else if(result.success){
        localStorage.setItem("lastFeedback", result.success.weeknum);
        localStorage.setItem("currentCaloriesIntake", result.success.currentCaloriesIntake);
        this.calculateCaloriesConsumed();
      }
    });
  }

  /* 
   * Calculate Day Completion Percentage
   *
   * @desc Calculate the percentage of days that a user has completed. This 
   *  number is used to create the Days Completed / Days Remaining progress bar.
   *
   * @return (float) progressPercentage The percentage of days that have been completed.
   *
   */
  calculateDayCompletionPercentage() {

    let progressPercentage = ( this.dayNumber / this.planLength_days );
    return progressPercentage;

  }
  
  
}



