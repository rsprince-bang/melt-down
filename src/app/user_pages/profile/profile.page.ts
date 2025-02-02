import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef} from '@angular/core';
import { FoodSuggestionsService } from 'src/app/services/food-suggestions.service';
import { GlobalServicesService } from 'src/app/services/global-services.service';
import { ApiCallService } from 'src/app/services/api-call.service';
import { environment } from 'src/environments/environment';
import { Router, RouterEvent, NavigationExtras } from '@angular/router';
import { AlertController, ModalController, PopoverController} from '@ionic/angular';
import { CalendarComponent } from '@syncfusion/ej2-angular-calendars';
import * as moment from 'moment-timezone';
import {ViewImg} from '../modals/view-img/view-img';
import { filter } from 'rxjs/operators';
import { title } from 'process';
import { Chart } from 'chart.js';
import {NotificationModal} from '../modals/notification-modal/notification-modal';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild('lineCanvas') lineCanvas: ElementRef;
  @ViewChild('calendar')
  public calendar: CalendarComponent;
  value: Date;
  dayNumber = null;
  date = null;
  previousDiets = [];
  startInfo = { date: '...', height: '...', weight: '...'};
  profileImageURL = 'https://gravatar.com/avatar/dba6bae8c566f9d4041fb9cd9ada7741?d=identicon&f=y';
  userMeasurements = null;
  dateVal = moment(new Date()).format('dddd,MMMM DD, YYYY');
  weekDays = [{'name': 'S', selected: false},
  {'name': 'M', selected: false},
  {'name': 'T', selected: true},
  {'name': 'W', selected: false},
  {'name': 'T', selected: false},
  {'name': 'F', selected: false},
  {'name': 'S', selected: false}];
  todaysList = [{time: '8:00 AM', name: 'Weigh in'},
  {time: '9:00 AM', name: 'Workout 1'},
  {time: '12:00 PM', name: 'Light Snack'},
  {time: '2:00 PM', name: 'Nap time, body!'}];
  isProfilePage = true;
  isSettingsPage = false;
  title = 'Me';
  isUploadData = false;
  isEditPhoto = false;
  imageUrl: any;
  settingWeighList = [{name : 'Weigh In Days', time: '9:00 AM'},{name: 'Pounds To Lose', time: '15 Ibs'}];
  uploadPhotoList =  [{name : 'Body Fat', time: '15%'}, {name: 'Body Mass', time: '20%'}, {name: 'Weight', time: '150 Ibs'}];
  _routeListener: any;
  urlId: any;
  refresh: any;
  weightRange = [];
  todayBodyFat = '15%';
  todayBodyMass = '20%';
  todayWeight = '150 lbs';
  bodyFatRange = [];
  bodyFatMass = [];
  weighWeight;
  weighInDays;
  weighInDaysList = [];
  editImg = '';
  isSchedulePage = false;
  startDay: any;
  startDayList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  startTime: any;
  endTime: any;
  weekDaysList: any;
  private barChart: Chart;
  constructor(private foodSuggestionsService: FoodSuggestionsService,
   private globalServices: GlobalServicesService, private myAPI: ApiCallService, private router: Router,
    private alertController: AlertController, public modalController: ModalController,
    private cd: ChangeDetectorRef, public popoverController: PopoverController) {
      this._routeListener = router.events.pipe(
        filter(e => e instanceof RouterEvent)
        ).subscribe((e: any) => {
        if (e.url === '/tabs/profile' && this.refresh) {
          if (this.urlId !== e.id) {
            console.log('URL', e.id, e.url, this.refresh);
            this.ngOnInit();
          }
          this.urlId = e.id;
        }
        this.refresh = true;
      });
    }

  ngOnInit() {
    this.updateChart();
    this.weekDaysList = this.weekDays;
    for (let i = 0; i <= 50; i++) {
      this.weightRange.push(i);
    }
    this.weighInDaysList.push(12 + ' AM');
    for (let i = 1; i <= 11 ; i++) {
      this.weighInDaysList.push(i + ' AM');
    }
    this.weighInDaysList.push(12 + ' PM');
    for (let i = 1; i <= 11 ; i++) {
      this.weighInDaysList.push(i + ' PM');
    }
    for (let i = 0; i <= 49 ; i++) {
      this.bodyFatRange.push(i);
      this.bodyFatMass.push(i);
    }
    this.isProfilePage = true;
    this.isSettingsPage = false;
    this.title ="Me"
    this.isUploadData = false;
    this.isEditPhoto = false;
    this.isSchedulePage = false;
  }

  ionViewWillEnter() {
    this.date = this.globalServices.getTodayDate();
    this.dayNumber = this.foodSuggestionsService.getDietDayNumber(this.date);

    //this.getProfileDetails();
  }

  getProfileDetails() {
    this.myAPI.makeAPIcall(
      "user_statistics.php",
      {
        "action": "getProfileDetails"
      },
      true
    ).subscribe((result) => {
      if (result.error) {
        this.myAPI.handleMyAPIError(result.error);
      }
      else {
        this.previousDiets = result.success.prev_diets;

        if (result.success.profile_image && result.success.profile_image.hasOwnProperty('url')) {
          this.profileImageURL = environment.API_URL + result.success.profile_image.url;
        }

        this.startInfo.date = result.success.start_date;
        this.startInfo.height = Math.floor(result.success.user_measurements.height_inches / 12) + '\'' + result.success.user_measurements.height_inches % 12 + '"';
        this.startInfo.weight = result.success.user_measurements.weight_lbs;

        this.userMeasurements = result.success.user_measurements;
      }
    });
  }

  async confirmReset() {
    const alert = await this.alertController.create({
      header: 'Confirm',
      message: 'Are you sure you want to reset your diet?',
      buttons: [
        {
            text: 'Yes',
            handler: () => {
              this.resetDiet();
            }
        },
        {
            text: 'No',
            handler: () => {
            }
        }
    ]
    });

    await alert.present();
  }

  resetDiet() {
    this.myAPI.makeAPIcall(
      "users.php",
      {
        "action": "resetDiet",
        "today_date": this.date,
        "yesterday_date": this.globalServices.getPreviousDate(this.date)
      },
      true
    ).subscribe((result) => {
      if (result.error) {
        this.myAPI.handleMyAPIError(result.error);
      }
      else {
        //localStorage.setItem('diet_start_date', JSON.stringify(result.success.diet_start_date));

        //when diet is reset, we need to confirm measurements and recalculate teh calories intake
        let navigationExtras: NavigationExtras = {
          state: {
            action: "confirm",
            userMeasurements: this.userMeasurements
          }
        };
        this.router.navigate(['enter-measurements'], navigationExtras);
      }
    });
  }

  viewOldDiet(from_date, to_date) {
    // console.log("View old diet here");
    // console.log(from_date);
    // console.log(to_date);
  }

  uploadPicture($event): void {
    this.myAPI.uploadImageFromFile($event.target.files[0], null, null, null, "profile")
      .subscribe((result) => {
        if (result.error) {
          this.myAPI.handleMyAPIError(result.error);
        }
        else {
          this.profileImageURL = environment.API_URL + result.url;
        }
      });
  }

  redirectToUpdatePage() {
    let navigationExtras: NavigationExtras = {
      state: {
        action: "update",
        userMeasurements: this.userMeasurements
      }
    };
    this.router.navigate(['enter-measurements'], navigationExtras);
  }

  deposit() {
    this.value = this.calendar.value; 
    this.dateVal = moment(this.calendar.value).format('dddd,MMMM DD, YYYY')
    console.log("moment(this.calendar.value).format('dddd,MMMM DD, yyyy')",)
  }
  onClickDate(data,i) {
    this.weekDays.forEach((item,index) =>{
      if(index == i) {
        data.selected = true
      } else {
        item.selected = false
      }
    });
  }
  async viewImg(imgUrl,date) {
    const modal = await this.modalController.create({
        component: ViewImg,
        cssClass : 'my-custom-modal-year-css',
        componentProps: { imgUrlData: imgUrl , date: date, page: 'viewImg' }
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();
        console.log('data t', data);
    if (data !== undefined) { }
  }
 
  async deleteItem(index) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'You are deleting a scheduled alert. Are you sure you wish to do this?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
          }
        }, {
          text: 'Ok',
          cssClass: 'endDiet',
          handler: () => {
            this.todaysList.splice(index, 1);
          }
        }
      ]
    });

    await alert.present();
  }
  onSettingsClick() {
    this.router.navigateByUrl('/settings');
    // this.isProfilePage = false;
    // this.isSettingsPage = true;
    // this.title = 'Settings';
    // this.isSchedulePage = false;
    // this.isUploadData = false;
    // this.isEditPhoto = false;
  }
  logout() {
    this.globalServices.logOut();
  }
  uploadFile(files: FileList) {
    const reader = new FileReader(); // HTML5 FileReader API
    const file = files[0];
    if (files[0]) {
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.imageUrl = reader.result;
      }
      this.cd.markForCheck();        
    }
  }
  uploadPhoto() {
    this.isUploadData = true;
    this.isProfilePage = false;
    this.isSettingsPage = false;
    this.isSchedulePage = false;
    this.title = "Upload Photo";
    this.imageUrl =""
    this.isEditPhoto = false
  }
  closeUpload() {
    this.isUploadData = false;
    this.isProfilePage = true;
    this.isSchedulePage = false;
    this.isSettingsPage = false;
    this.isEditPhoto = false
    this.title = "Me"
  }
  
  async deletePhoto() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'This will permanently remove this photo from your gallery. Are you sure you wish to proceed?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
          }
        }, {
          text: 'Ok',
          cssClass: 'endDiet',
          handler: () => {
            this.isUploadData = false;
            this.isProfilePage = true;
            this.isSchedulePage = false;
            this.isSettingsPage = false;
            this.isEditPhoto = false
            this.title = "Me"
          }
        }
      ]
    });

    await alert.present();
  }
  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Are you sure you want to do this? Remember, when you reset your plan, all your current progress will be deleted.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
          }
        }, {
          text: 'OK',
          cssClass: 'endDiet',
          handler: () => this.router.navigateByUrl('/reset-diet')
        }
      ]
    });

    await alert.present();
  }
  async viewAllPhotos() {
    const modal = await this.modalController.create({
      component: ViewImg,
      cssClass : 'my-custom-modal-year-css',
      componentProps: {  }
      });
      await modal.present();
      const { data } = await modal.onWillDismiss();
    if (data != undefined) { 
      
      if(data.data == 'edit') {
        this.isEditPhoto = true;
        this.isProfilePage = false;
        this.isSchedulePage = false;
        this.isSettingsPage=  false;
        this.isUploadData=  false;
        this.title = 'Edit Photo'
        this.editImg = data.img;
      } else {
        this.uploadPhoto();
      }

    }
  }
  onChangeFat(todayBodyFat) {
    localStorage.setItem('todayBodyFat', JSON.stringify(todayBodyFat));
  }
  onChangeMass(todayBodyMass) {
    localStorage.setItem('todayBodyMass', JSON.stringify(todayBodyMass));
  }
  onChangeWeight(todayWeight) {
    const data: any = todayWeight.split(' ');
    localStorage.setItem('todayWeight', JSON.stringify(data[1]));
  }
  onClickAddSchedule() {
    this.isProfilePage = false;
    this.isSettingsPage = false;
    this.title = 'Upload';
    this.isSchedulePage = true;
    this.isUploadData = false;
    this.isEditPhoto = false;
    this.weekDaysList.forEach(item => {
      item.selected = false;
    });
  }
  onChangeStartDay(day) {

  }
  onChangeStartTime(startTime) {
  }
  onChangeEndTime(endTime) {
  }
  // function to select weekday
  onClickWeekDay(day, i) {
    day.selected = !day.selected;
  }
  /* function to load goal tracker chart */
  updateChart() {
    this.barChart = new Chart(this.lineCanvas.nativeElement, {
        type: 'line',
        data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
            datasets: [{
                label: 'Goal Weight',
                data: [150, 150, 150, 150,150, 150, 150, 150, 150],
                fill: false, borderColor: '#FF08E3', backgroundColor: '#FF08E3'},
                {label: 'Current Weight',
                data: [170, 167, 170, 160, 164, 163, 155, 152, 150],
                fill: false, borderColor: '#73FFF8', backgroundColor: '#73FFF8'
            }]
        },
        options: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              fontColor: 'white',
              fontSize: 12,
              usePointStyle: true, boxWidth: 6
            }
          },
          scales: {
            xAxes: [{
                gridLines: {
                    display: true,
                    color: 'white',
                  drawBorder: true,
                  drawTicks: false
                },
                ticks: {
                  fontColor: 'white',
                  padding: 10
                },
            }],
            yAxes: [{
                display: true,
                gridLines: {
                    display: true,
                    color: 'white',
                  drawBorder: true,
                  drawTicks: false,
                  tickMarkLength: 15,
                },
                ticks: {
                  fontColor: 'white',
                  padding: 20,
                  fontSize: 12,
                  min: 110,
                  max: 190, // Your absolute max value
                  // callback: function (value) {
                  //   return value + '%'; // convert it to percentage
                  // },
                },
                scaleLabel: {
                  display: true,
                },
            }],
        }
        }
    });
  }
  async handleButtonClick(ev) {
    const popover = await this.popoverController.create({
       component: NotificationModal,
       event: ev,
       translucent: true,
     });
     await popover.present();
     const { data } = await popover.onWillDismiss();
   }
}
