import { Component, OnInit } from '@angular/core';
import { AuthApiService } from '../Services/AuthApiService';
import { Router } from '@angular/router';
import { Values } from '../values';
import { InitService } from '../Services/InitService';
import { MessageService } from '../Services/MessageService';
import { HeaderService } from '../Services/HeaderService';
import Swal from 'sweetalert2';
import { ElectronService } from 'ngx-electron';

@Component({
    templateUrl: '../Views/settings.html',
    styleUrls: ['../Styles/menu.css',
                '../Styles/button.css',
                '../Styles/badge.css']
})
export class SettingsComponent implements OnInit {
    public loadingImgURL = Values.loadingImgURL;
    constructor(
        private authApiService: AuthApiService,
        private router: Router,
        private initSerivce: InitService,
        public messageService: MessageService,
        private headerService: HeaderService,
        private _electronService: ElectronService) {
            this.headerService.title = 'Me';
            this.headerService.returnButton = false;
            this.headerService.button = false;
            this.headerService.shadow = false;
        }

    public ngOnInit(): void {
        this.authApiService.Me().subscribe(p => {
            if (p.code === 0) {
                this.messageService.me = p.value;
                this.messageService.me.avatarURL = Values.fileAddress + p.value.headImgFileKey;
            }
        });
    }

    public SignOut(): void {
        Swal.fire({
            title: 'Are you sure to sign out?',
            type: 'warning',
            showCancelButton: true
        }).then((willSignOut) => {
            if (willSignOut.value) {
                if (this._electronService.isElectronApp) {
                    this.callLogOffAPI(-1);
                    return;
                }
                const _this = this;
                navigator.serviceWorker.ready.then(function(reg) {
                    return reg.pushManager.getSubscription().then(function(subscription) {
                        let deviceID = localStorage.getItem('deviceID');
                        if (deviceID === null) {
                            deviceID = '-1';
                        }
                        if (subscription != null) {
                            subscription.unsubscribe().then().catch(function(e) {
                                console.log(e);
                            });
                        }
                        _this.callLogOffAPI(Number(deviceID));
                    });
                }.bind(_this));
            }
        });
    }

    private callLogOffAPI(deviceID: number): void {
        const _this = this;
        this.authApiService.LogOff(Number(deviceID)).subscribe({
            next() {
                _this.initSerivce.destroy();
                _this.router.navigate(['/signin'], {replaceUrl: true});
            },
            error(e) {
                Swal.fire('Logoff error', e.message, 'error');
            }
        });
    }

    public sendEmail(): void {
        Swal.fire({
            title: 'Please verify your email.',
            text: 'Please confirm your email as soon as possible! Or you may lose access \
                to your account in a few days! Without confirming your email, you won\'t receive \
                any important notifications and cannot reset your password!',
            type: 'warning',
            confirmButtonText: 'Send Email',
            showCancelButton: true
        }).then((sendEmail) => {
            if (sendEmail.value && this.messageService.me) {
                this.authApiService.SendMail(this.messageService.me.email).subscribe((result) => {
                    if (result.code === 0) {
                        Swal.fire({
                            title: 'Please check your inbox.',
                            text: 'Email was send to ' + this.messageService.me.email,
                            type: 'success'
                        });
                    } else {
                        Swal.fire({
                            title: 'Error',
                            text: result.message,
                            type: 'error'
                        });
                    }
                });
            }
        });
    }
}
