var socket = null;
var raids = [];
var raidConfigs = [];
var selectedRaidsArray = [];
var individualSettings = [];
var wasDown = false;
var noTwitter = false;

var beepsSoundNotif = new Audio( '/assets/sounds/Beeps_Appear.wav' );
var lilyRingRingSoundNotif = new Audio( '/assets/sounds/Lily_Event_RingRing.mp3' );
var andiraOniichanSoundNotif = new Audio( '/assets/sounds/Andira_Oniichan.mp3' );
var titanfallDroppingNowSoundNotif = new Audio( '/assets/sounds/Titanfall_DroppingNow.mp3' );
var hoeeeeeSoundNotif = new Audio( '/assets/sounds/HOEEEEE.mp3' );
var alarmFoghornSoundNotif = new Audio( '/assets/sounds/ALARM_Foghorn_full_stereo.wav' );
var alarmSubmarineSoundNotif = new Audio( '/assets/sounds/ALARM_Submarine_Slow_loop_stereo.wav' );
var chargeSciFiSweepSoundNotif = new Audio( '/assets/sounds/CHARGE_Sci-Fi_Sweep.wav' );
var femaleGoGoGoSoundNotif = new Audio( '/assets/sounds/female_go_go_go.ogg' );
var maleGoGoGoSoundNotif = new Audio( '/assets/sounds/male_go_go_go.ogg' );
var femaleHurryUpSoundNotif = new Audio( '/assets/sounds/female_hurry_up.ogg' );
var maleHurryUpSoundNotif = new Audio( '/assets/sounds/male_hurry_up.ogg' );
var jingleNESSoundNotif = new Audio( '/assets/sounds/jingles_NES16.ogg' );
var jingleSaxSoundNotif = new Audio( '/assets/sounds/jingles_SAX00.ogg' );
var jingleSteel0SoundNotif = new Audio( '/assets/sounds/jingles_STEEL00.ogg' );
var jingleSteel16SoundNotif = new Audio( '/assets/sounds/jingles_STEEL16.ogg' );
var magicSpellSoundNotif = new Audio( '/assets/sounds/MAGIC_SPELL_Attacking.wav' );
var zapThreeToneSoundNotif = new Audio( '/assets/sounds/zapThreeToneUp.mp3' );
var zapTwoToneSoundNotif = new Audio( '/assets/sounds/zapTwoTone2.mp3' );
var customSoundNotif = new Audio();

var settings = {
	notification: {
		soundNotifOn: false,
		soundNotifVolume: 100,
		soundNotifChoice: "beeps",
		desktopNotifOn: false,
		desktopNotifSize: "large"
	},
	layout: {
		orientation: "horizontal",
		verticalStacking: "row",
		infoLevel: "normal",
		raidTimeout: 120,
		raidMaxResults: 30,
		nightMode: false,
		toolbarShrink: false
	},
	version: "3.0",
	newsSeen: false,
	cardSlots: 8,
	viramateID: "fgpokpknehglcioijejfeebigdnbnokj"
};

function CheckConnectionStatus() {
	if ( socket.connected ) {
		document.getElementById( "connection-status" ).classList.remove( "red" );
		document.getElementById( "connection-status" ).classList.add( "green" );
		document.getElementById( "connection-status-value" ).innerHTML = "UP";
		if ( wasDown ) {
			console.log( "Recovering from connection down..." );
			if ( localStorage.getItem( "selectedRaids" ) ) {
				var tempSelectedRaids = JSON.parse( localStorage.getItem( "selectedRaids" ) );
				for ( var i = 0; i < tempSelectedRaids.length; i++ ) {
					socket.emit( 'subscribe', {
						room: tempSelectedRaids[ i ]
					} );
				}
			}
		}
		wasDown = false;
	} else {
		document.getElementById( "connection-status" ).classList.remove( "green" );
		document.getElementById( "connection-status" ).classList.add( "red" );
		document.getElementById( "connection-status-value" ).innerHTML = "DOWN";
		wasDown = true;
	}
}

window.addEventListener( 'load', function () {
	console.log( "Window loaded." );
	if ( !navigator.onLine ) {
		console.log( "Page loaded offline." );
		swal( {
			title: "You are offline!",
			text: "Please make sure your internet is connected or try again later.",
			imageUrl: "assets/stickers/nope-sticker.png",
			imageSize: '150x150'
		} );
	}
	window.addEventListener( 'online', function ( event ) {
		console.log( "Page came back online." );
		swal( {
			title: "You came back online!",
			text: "Things should start working again!",
			imageUrl: "assets/stickers/iknowthatalready-sticker.png",
			imageSize: '150x150'
		} );
	} );

	window.addEventListener( 'offline', function ( event ) {
		console.log( "Page is offline." );
		swal( {
			title: "You are offline!",
			text: "Please make sure your internet is connected or try again later.",
			imageUrl: "assets/stickers/nope-sticker.png",
			imageSize: '150x150'
		} );
	} );

	window.addEventListener( 'message', onMessage, false );

	function onMessage( evt ) {
		console.log( "Viramate message recieved." );
		if ( evt.data.type !== "result" ) {
			console.log( "Viramate message not a result." );
			return;
		} else {
			console.log( "Viramate message:" );
			console.dir( evt.data );
			if ( evt.data.result === "refill required" ) {
				document.getElementById( evt.data.id + '-btn' ).classList.remove( "secondary" );
				document.getElementById( evt.data.id + '-btn' ).classList.add( "yellow" );
				document.getElementById( evt.data.id + '-btn' ).innerHTML = 'No BP<i class="right quarter thermometer icon"></i>';
				FindRaid( evt.data.id ).status = "error";
				swal( {
					title: "No more BP!",
					text: "Please refill your BP or try again later.",
					imageUrl: "assets/stickers/waitup-sticker.png",
					imageSize: '150x150',
					timer: 2000
				} );
			} else if ( evt.data.result === "popup: This raid battle has already ended." ) {
				document.getElementById( evt.data.id + '-btn' ).classList.remove( "secondary" );
				document.getElementById( evt.data.id + '-btn' ).classList.add( "negative" );
				document.getElementById( evt.data.id + '-btn' ).innerHTML = 'Raid Over<i class="right hourglass empty icon"></i>';
				document.getElementById( evt.data.id + '-btn' ).disabled = true;
				FindRaid( evt.data.id ).status = "error";
				swal( {
					title: "Raid has ended!",
					text: "Please try a different raid.",
					imageUrl: "assets/stickers/fail-sticker.png",
					imageSize: '150x150',
					timer: 2000
				} );
			} else if ( evt.data.result.error === "api disabled" ) {
				document.getElementById( evt.data.id + '-btn' ).classList.remove( "secondary" );
				document.getElementById( evt.data.id + '-btn' ).classList.add( "orange" );
				document.getElementById( evt.data.id + '-btn' ).innerHTML = 'Viramate Disabled<i class="right power icon"></i>';
				FindRaid( evt.data.id ).status = "error";
				swal( {
					title: "Viramate Web API is disabled!",
					text: "Please enable the web API in Viramate, refresh your GBF tab, and try again.",
					imageUrl: "/assets/stickers/aboutthat-sticker.png",
					imageSize: '150x150',
					timer: 2000
				} );
			} else if ( evt.data.result.error === "No granblue tab found" ) {
				document.getElementById( evt.data.id + '-btn' ).classList.remove( "secondary" );
				document.getElementById( evt.data.id + '-btn' ).classList.add( "orange" );
				document.getElementById( evt.data.id + '-btn' ).innerHTML = 'No Granblue<i class="right help icon"></i>';
				FindRaid( evt.data.id ).status = "error";
				swal( {
					title: "You don't have Granblue open!",
					text: "Please open the game and then try joining a raid.",
					imageUrl: "assets/stickers/aboutthat-sticker.png",
					imageSize: '150x150',
					timer: 2000
				} );
			} else if ( evt.data.result === "popup: This raid battle is full. You can't participate." ) {
				document.getElementById( evt.data.id + '-btn' ).classList.remove( "secondary" );
				document.getElementById( evt.data.id + '-btn' ).classList.add( "negative" );
				document.getElementById( evt.data.id + '-btn' ).innerHTML = 'Full Raid<i class="right users icon"></i>';
				document.getElementById( evt.data.id + '-btn' ).disabled = true;
				FindRaid( evt.data.id ).status = "error";
				swal( {
					title: "Raid is full!",
					text: "Please try a different raid.",
					imageUrl: "assets/stickers/sorry-sticker.png",
					imageSize: '150x150',
					timer: 2000
				} );
			} else if ( evt.data.result === "popup: The number that you entered doesn't match any battle." ) {
				document.getElementById( evt.data.id + '-btn' ).classList.remove( "secondary" );
				document.getElementById( evt.data.id + '-btn' ).classList.add( "yellow" );
				document.getElementById( evt.data.id + '-btn' ).innerHTML = 'Full Raid<i class="right zoom out icon"></i>';
				document.getElementById( evt.data.id + '-btn' ).disabled = true;
				FindRaid( evt.data.id ).status = "error";
				swal( {
					title: "Error with Raid ID!",
					text: "Sorry, but that raid ID doesn't match any raid.",
					imageUrl: "/assets/stickers/totallycrushed-sticker.png",
					imageSize: '150x150',
					timer: 2000
				} );
			} else if ( evt.data.result === "already in this raid" ) {
				document.getElementById( evt.data.id + '-btn' ).classList.remove( "secondary" );
				document.getElementById( evt.data.id + '-btn' ).classList.add( "positive" );
				document.getElementById( evt.data.id + '-btn' ).innerHTML = 'Already Joined<i class="right hand peace icon"></i>';
				document.getElementById( evt.data.id + '-btn' ).disabled = true;
				FindRaid( evt.data.id ).status = "error";
				swal( {
					title: "You are already in this raid!",
					text: "Please try a different raid.",
					imageUrl: "assets/stickers/whoops-sticker.png",
					imageSize: '150x150',
					timer: 2000
				} );
			} else if ( evt.data.result === "ok" ) {
				document.getElementById( evt.data.id + '-btn' ).classList.remove( "secondary" );
				document.getElementById( evt.data.id + '-btn' ).classList.add( "positive" );
				document.getElementById( evt.data.id + '-btn' ).innerHTML = 'Already Joined<i class="right hand peace icon"></i>';
				document.getElementById( evt.data.id + '-btn' ).disabled = true;
				FindRaid( evt.data.id ).status = "success";
			}
		}
	}
	console.log( "Getting raid configs..." );
	fetch( "/getraids" ).then( function ( response ) {
		return response.json();
	} ).then( function ( raidResults ) {
		console.log( "Raid configs recieved." );
		raidConfigs = raidResults;
		LoadSavedSettings();
		SetupControls();
		localStorage.setItem( "savedSettings", JSON.stringify( settings ) );
		SetupTable();
		socket = io.connect( '/' );
		socket.on( 'tweet', function ( data ) {
			console.log( "Tweet recieved:" );
			console.dir( data );
			document.getElementById( "connection-status" ).classList.remove( "red" );
			document.getElementById( "connection-status" ).classList.add( "green" );
			document.getElementById( "connection-status-value" ).innerHTML = "UP";
			noTwitter = false;
			if ( document.getElementById( data.id ) === null ) {
				raids.push( data );
				CreateRaidRow( data );
				PlaySoundNotif( data );
				SendDesktopNotif( data );
			}
		} );
		socket.on( 'warning', function ( data ) {
			console.log( "Warning recieved:" );
			console.dir( data );
			if ( data.type == "twitter" ) {
				document.getElementById( "connection-status" ).classList.remove( "green" );
				document.getElementById( "connection-status" ).classList.add( "red" );
				document.getElementById( "connection-status-value" ).innerHTML = "DOWN";
				noTwitter = true;
			}
		} );
		LoadSavedRaids();
		if ( socket.connected ) {
			document.getElementById( "connection-status" ).classList.remove( "red" );
			document.getElementById( "connection-status" ).classList.add( "green" );
			document.getElementById( "connection-status-value" ).innerHTML = "UP";
		} else {
			document.getElementById( "connection-status" ).classList.remove( "green" );
			document.getElementById( "connection-status" ).classList.add( "red" );
			document.getElementById( "connection-status-value" ).innerHTML = "DOWN";
		}
		setInterval( function () {
			if ( !noTwitter ) {
				CheckConnectionStatus();
			}
			if ( selectedRaidsArray.length === 0 ) {
				document.getElementById( "selected-raids" ).innerHTML = "No raids selected. Please search for a raid in the search bar above.";
			}
			for ( var i = raids.length - 1; i >= 0; i-- ) {
				UpdateRaidRow( raids[ i ] );
			}
		}, 500 );
		var galite = galite || {};
		galite.UA = 'UA-48921108-3';
	} );
} );

function PlaySoundNotif( data ) {
	console.log( "Playing sound notif for: " + data.room );
	console.log( `Sound Settings: Layout Orientation = ${settings.layout.orientation},  Are Sound Notifs On = ${settings.notification.soundNotifOn},  Sound Notif Choice = ${settings.notification.soundNotifChoice}, Sound Notif Volume = ${settings.notification.soundNotifVolume}` );
	if ( settings.layout.orientation === "horizontal" && settings.notification.soundNotifOn ) {
		try {
			console.log( "Trying to play sound notif..." );
			switch ( settings.notification.soundNotifChoice ) {
				case "alarm-foghorn":
					alarmFoghornSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					alarmFoghornSoundNotif.play();
					break;
				case "alarm-submarine":
					alarmSubmarineSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					alarmSubmarineSoundNotif.play();
					break;
				case "scifi-sweep":
					chargeSciFiSweepSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					chargeSciFiSweepSoundNotif.play();
					break;
				case "female-gogogo":
					femaleGoGoGoSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					femaleGoGoGoSoundNotif.play();
					break;
				case "male-gogogo":
					maleGoGoGoSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					maleGoGoGoSoundNotif.play();
					break;
				case "female-hurryup":
					femaleHurryUpSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					femaleHurryUpSoundNotif.play();
					break;
				case "male-hurryup":
					maleHurryUpSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					maleHurryUpSoundNotif.play();
					break;
				case "jingle-nes":
					jingleNESSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					jingleNESSoundNotif.play();
					break;
				case "jingle-sax":
					jingleSaxSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					jingleSaxSoundNotif.play();
					break;
				case "jingle-steel":
					jingleSteel0SoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					jingleSteel0SoundNotif.play();
					break;
				case "jingle-steel2":
					jingleSteel16SoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					jingleSteel16SoundNotif.play();
					break;
				case "zap-3tone":
					zapThreeToneSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					zapThreeToneSoundNotif.play();
					break;
				case "zap-2tone":
					zapTwoToneSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					zapTwoToneSoundNotif.play();
					break;
				case "magic-spell":
					magicSpellSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					magicSpellSoundNotif.play();
					break;
				case "custom":
					customSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					customSoundNotif.play();
					break;
				case "beeps":
					beepsSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					beepsSoundNotif.play();
					break;
				case "lily-event-ringring":
					lilyRingRingSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					lilyRingRingSoundNotif.play();
					break;
				case "andira-oniichan":
					andiraOniichanSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					andiraOniichanSoundNotif.play();
					break;
				case "titanfall-droppingnow":
					titanfallDroppingNowSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					titanfallDroppingNowSoundNotif.play();
					break;
				case "sakura-hoeeeee":
					hoeeeeeSoundNotif.volume = ( settings.notification.soundNotifVolume / 100 );
					hoeeeeeSoundNotif.play();
					break;
			}
			console.log( "Played sound notif." );
		} catch ( error ) {
			console.log( "Error playing sound notif: " + error );
		}
	} else if ( settings.layout.orientation === "vertical" ) {
		for ( var i = 0; i < individualSettings.length; i++ ) {
			if ( data.room === individualSettings[ i ].room ) {
				if ( individualSettings[ i ].settings.soundNotifOn ) {
					try {
						console.log( "Trying to play sound notif..." );
						switch ( individualSettings[ i ].settings.soundNotifChoice ) {
							case "alarm-foghorn":
								alarmFoghornSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								alarmFoghornSoundNotif.play();
								break;
							case "alarm-submarine":
								alarmSubmarineSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								alarmSubmarineSoundNotif.play();
								break;
							case "scifi-sweep":
								chargeSciFiSweepSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								chargeSciFiSweepSoundNotif.play();
								break;
							case "female-gogogo":
								femaleGoGoGoSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								femaleGoGoGoSoundNotif.play();
								break;
							case "male-gogogo":
								maleGoGoGoSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								maleGoGoGoSoundNotif.play();
								break;
							case "female-hurryup":
								femaleHurryUpSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								femaleHurryUpSoundNotif.play();
								break;
							case "male-hurryup":
								maleHurryUpSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								maleHurryUpSoundNotif.play();
								break;
							case "jingle-nes":
								jingleNESSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								jingleNESSoundNotif.play();
								break;
							case "jingle-sax":
								jingleSaxSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								jingleSaxSoundNotif.play();
								break;
							case "jingle-steel":
								jingleSteel0SoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								jingleSteel0SoundNotif.play();
								break;
							case "jingle-steel2":
								jingleSteel16SoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								jingleSteel16SoundNotif.play();
								break;
							case "zap-3tone":
								zapThreeToneSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								zapThreeToneSoundNotif.play();
								break;
							case "zap-2tone":
								zapTwoToneSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								zapTwoToneSoundNotif.play();
								break;
							case "magic-spell":
								magicSpellSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								magicSpellSoundNotif.play();
								break;
							case "custom":
								customSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								customSoundNotif.play();
								break;
							case "beeps":
								beepsSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								beepsSoundNotif.play();
								break;
							case "lily-event-ringring":
								lilyRingRingSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								lilyRingRingSoundNotif.play();
								break;
							case "andira-oniichan":
								andiraOniichanSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								andiraOniichanSoundNotif.play();
								break;
							case "titanfall-droppingnow":
								titanfallDroppingNowSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								titanfallDroppingNowSoundNotif.play();
								break;
							case "sakura-hoeeeee":
								hoeeeeeSoundNotif.volume = ( individualSettings[ i ].settings.soundNotifVolume / 100 );
								hoeeeeeSoundNotif.play();
								break;
						}
						console.log( "Played sound notif." );
					} catch ( error ) {
						console.log( "Error playing sound notif: " + error );
					}
				}
			}
		}
	}
}

function SendDesktopNotif( data ) {
	console.log( "Sending desktop notif for: " + data.room );
	console.log( `Desktop Settings: Layout Orientation = ${settings.layout.orientation}, Are Desktop Notifs On = ${settings.notification.desktopNotifOn}, Desktop Notif Size = ${settings.notification.desktopNotifSize}` );
	if ( settings.layout.orientation === "horizontal" && settings.notification.desktopNotifOn ) {
		if ( Notification.permission === "granted" ) {
			try {
				var raidConfig = FindRaidConfig( data.room );
				console.log( "Trying to send desktop notif..." );
				var notification = null;
				var title = "";
				if ( data.language === "EN" ) {
					title = raidConfig.english;
				} else {
					title = raidConfig.japanese;
				}
				if ( settings.notification.desktopNotifSize === "small" ) {
					notification = new Notification( title, {
						body: "ID: " + data.id + "\nTweeter: " + data.user + "\nMessage: " + data.message,
						icon: raidConfig.image
					} );
				} else {
					notification = new Notification( title, {
						body: "ID: " + data.id,
						image: raidConfig.image
					} );
				}
				setTimeout( function () {
					notification.close();
				}, 5000 );
				notification.onclick = function ( event ) {
					event.preventDefault();
					var raidLabel = document.getElementById( data.id + '-label' );
					if ( raidLabel !== null ) {
						if ( window.getSelection ) {
							raidLabel.focus();
							var selection = window.getSelection();
							var range = document.createRange();
							range.selectNodeContents( raidLabel );
							selection.removeAllRanges();
							selection.addRange( range );
							document.execCommand( "copy" );
						}
					}
					SendJoinCommand( data.id )
					document.getElementById( data.id + '-btn' ).classList.remove( "primary" );
					document.getElementById( data.id + '-btn' ).classList.add( "negative" );
					notification.close();
				}
				console.log( "Sent desktop notif." );
			} catch ( error ) {
				console.log( "Error sending desktop notif: " + error );
			}
		}
	} else if ( settings.layout.orientation === "vertical" ) {
		for ( var i = 0; i < individualSettings.length; i++ ) {
			if ( data.room === individualSettings[ i ].room ) {
				if ( individualSettings[ i ].settings.desktopNotifOn ) {
					var raidConfig = FindRaidConfig( data.room );
					if ( Notification.permission === "granted" ) {
						try {
							var raidConfig = FindRaidConfig( data.room );
							console.log( "Trying to send desktop notif..." );
							var notification = null;
							var title = "";
							if ( data.language === "EN" ) {
								title = raidConfig.english;
							} else {
								title = raidConfig.japanese;
							}
							if ( individualSettings[ i ].settings.desktopNotifSize === "small" ) {
								notification = new Notification( title, {
									body: "ID: " + data.id + "\nTweeter: " + data.user + "\nMessage: " + data.message,
									icon: raidConfig.image
								} );
							} else {
								notification = new Notification( title, {
									body: "ID: " + data.id,
									image: raidConfig.image
								} );
							}
							setTimeout( function () {
								notification.close();
							}, 4000 );
							notification.onclick = function ( event ) {
								event.preventDefault();
								var raidLabel = document.getElementById( data.id + '-label' );
								if ( raidLabel !== null ) {
									if ( window.getSelection ) {
										raidLabel.focus();
										var selection = window.getSelection();
										var range = document.createRange();
										range.selectNodeContents( raidLabel );
										selection.removeAllRanges();
										selection.addRange( range );
										document.execCommand( "copy" );
									}
								}
								SendJoinCommand( data.id )
								document.getElementById( data.id + '-btn' ).classList.remove( "primary" );
								notification.close();
							}
							console.log( "Sent desktop notif." );
						} catch ( error ) {
							console.log( "Error sending desktop notif: " + error );
						}
					}
				}
				break;
			}
		}
	}
}

function SendJoinCommand( id ) {
	try {
		document.getElementById( "viramate-api" ).contentWindow.postMessage( {
			type: "tryJoinRaid",
			id: id,
			raidCode: id
		}, "*" );
	} catch ( error ) {
		console.log( "Error sending message to Viramate: " + error );
	}
}
