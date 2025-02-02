import * as tslib_1 from "tslib";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HomeAddWorkoutModalPage } from './home-add-workout-modal.page';
var routes = [
    {
        path: '',
        component: HomeAddWorkoutModalPage
    }
];
var HomeAddWorkoutModalPageModule = /** @class */ (function () {
    function HomeAddWorkoutModalPageModule() {
    }
    HomeAddWorkoutModalPageModule = tslib_1.__decorate([
        NgModule({
            imports: [
                CommonModule,
                FormsModule,
                IonicModule,
                RouterModule.forChild(routes)
            ],
            declarations: [HomeAddWorkoutModalPage]
        })
    ], HomeAddWorkoutModalPageModule);
    return HomeAddWorkoutModalPageModule;
}());
export { HomeAddWorkoutModalPageModule };
//# sourceMappingURL=home-add-workout-modal.module.js.map