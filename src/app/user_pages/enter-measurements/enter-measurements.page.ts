import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms'; //in order to use forms I had to import "ReactiveFormsModule" in this page's module
import { PickerController } from '@ionic/angular';
import { ApiCallService } from 'src/app/services/api-call.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FoodSuggestionsService } from 'src/app/services/food-suggestions.service';
import { GlobalServicesService } from 'src/app/services/global-services.service';

@Component({
  selector: 'app-enter-measurements',
  templateUrl: './enter-measurements.page.html',
  styleUrls: ['./enter-measurements.page.scss'],
})
export class EnterMeasurementsPage implements OnInit {

  measurementsForm: FormGroup;
  action = "save";
  height: any;
  currentUserMeasurements = {
    heightInches:"",  
    weight: "", 
    age:"", 
    gender:"", 
    plan:"" 
  };
    fileData1: any;
    imageUrl: any = '../../../assets/icon/plaindp.png';
    isImageUploaded: boolean = false;

    ageOptions = [];
    genderOptions = ['Male', 'Female'];
    weightOptions = [];
    planOptions =  ['7 week', '12 week'];
    // activityOptions = [
    //   {level: 'Sedentary', value: 1.2000},
    //   {level: 'Light Exercise 1-3 days/week', value: 1.3750},
    //   {level: 'Moderate Exercise 3-5 days/week', value: 1.5500},
    //   {level: 'Hardcore Exercise or Sports 6-7 days/week', value: 1.7250},
    //   {level: 'Hardcore Exercise or Sports 6-7 days/week  + labor intensive job', value: 1.9000}
    // ];
    heightOptions = [];

  constructor(
		private formBuilder: FormBuilder, 
		private myAPI: ApiCallService, 
		private route: ActivatedRoute, 
		private router: Router, 
		private navCtrl: NavController,
		private foodSuggestionsService: FoodSuggestionsService, 
		private globalServices: GlobalServicesService
	) {

    this.route.queryParams.subscribe(params => {
      if ( this.router.getCurrentNavigation().extras && this.router.getCurrentNavigation().extras.state) {
        this.action = this.router.getCurrentNavigation().extras.state.action; // has value of "update" because it is coming from profile page
                                                                              //or has value of "confirm" if coming from reset diet redirect
        this.currentUserMeasurements = this.router.getCurrentNavigation().extras.state.userMeasurements;
        this.currentUserMeasurements.heightInches = "" + Math.floor(this.router.getCurrentNavigation().extras.state.userMeasurements.height_inches/12);
        this.currentUserMeasurements.plan = this.foodSuggestionsService.getDietPlanWeeks().toString();
      }
    });
    
  }

  ngOnInit() {
    this.measurementsForm = this.formBuilder.group({
      age: [this.currentUserMeasurements.age, [ Validators.required, Validators.pattern('[0-9]+') ]],
      gender: [this.currentUserMeasurements.gender, [ Validators.required ]],
      height: [ this.currentUserMeasurements.heightInches, [ Validators.required ]],
      weight: [this.currentUserMeasurements.weight, [ Validators.required, Validators.pattern('[0-9]+') ]],
      plan: [this.currentUserMeasurements.plan, [ Validators.required, Validators.pattern('[0-9]+') ]]
    });

    this.generateAges(18, 100);
    this.generateWeights(90, 300);
    this.generateHeights(4, 6);
  }

  submitMeasurements(){
    this.myAPI.makeAPIcall(
      "user", 
      {
        "action": "submitMeasurements",
        "form": this.measurementsForm.value,
        "today": this.globalServices.getDate("today")
      },
      true
    ).subscribe((result)=>{
      if( result.error ){
        this.myAPI.handleMyAPIError(result.error);
      }
      else {
        localStorage.setItem("measurements", JSON.stringify(result.success.measurements));
        localStorage.setItem("diet", JSON.stringify(result.success.diet));
        localStorage.setItem("dailyCaloriesIntake", result.success.measurements.dailyCaloriesIntake);
        localStorage.setItem("currentCaloriesIntake", result.success.diet.cur_calories_intake);
        localStorage.setItem("diet_plan_length", this.measurementsForm.value.plan);
        localStorage.setItem('diet_start_date', JSON.stringify(result.success.diet.diet_start_date));
        localStorage.setItem("lastFeedback", result.success.diet.feedback_for_week);

        if( this.action == "update" ){
          this.router.navigateByUrl("/profile");
        }
        else{
          this.router.navigateByUrl("/tabs/home/today");
        }
      }
    });
  }
	
  uploadFile(files: FileList) {
    this.isImageUploaded = true;
    let reader = new FileReader(); // HTML5 FileReader API
    let file = files[0];
    this.fileData1 = file
    if (files[0]) {
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.imageUrl = reader.result;
      }
    }
  }

  generateAges(start, end) {
    for(let i = start; i <= end; i++){
      this.ageOptions.push(i);
		}
		return true;
  }

  generateHeights(start, end) {
    for(let feet = start; feet <= end; feet++){
      for(let inches = 0; inches <= 11; inches++) {
        let height = feet + "' " + inches + '"';
        let value = (feet * 12) + inches;
        this.heightOptions.push({option: height, valueInches: value});
      }
		}
		return true;
  }

  generateWeights(start, end) {
    for(let i = start; i <= end; i++){
      this.weightOptions.push(i);
		}
		return true;
  }

}