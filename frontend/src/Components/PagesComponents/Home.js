import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {Paper, CircularProgress, Divider, Typography, Grid, Box, } from '@material-ui/core'
import ExploreIcon from '@material-ui/icons/Explore';
import {GoogleMap, Marker, InfoWindow} from "@react-google-maps/api";
import mapStyles from "../MiscComponents/mapStyles";
import {ListItemSecondaryAction, ListItemText, ListItem, List} from "@material-ui/core";
import usePlaceAutocomplete, {getGeocode, getLatLng} from "use-places-autocomplete";
import {Combobox, ComboboxInput, ComboboxPopover,
        ComboboxList, ComboboxOption, ComboboxOptionText} from "@reach/combobox";
import "@reach/combobox/styles.css";
import Geocode from 'react-geocode';

const useStyles = makeStyles((theme) => ({
    topPintsAreaText: {
        fontWeight: 650,
        color: 'grey',
        fontSize: 22,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 10
    },
    topPintsTable: {
       height: 450,
       overflow: 'scroll',
    },
    listItemText: {
        fontSize: 10
    },
    progressLoader: {
       color: '#e68a00',
       position: 'relative',
       marginTop: '20px',
       marginLeft: '45%'
    },
    search: {
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '400px',
          zIndex: '10'
    },
    locate: {
        position: 'absolute',
        marginTop: 10,
        marginLeft: 10,
        background: 'none',
        border: 'none',
        fontSize: 35,
        zIndex: 10,
          '&:hover': {
          color: '#595959',

         },
    },
    dropDownVenues: {
        borderStyle: 'solid',
        borderColor: 'grey',
        position: 'relative',
        zIndex: 9999,
        backgroundColor: 'white'
    },

}));


export default function Home(props) {

  const classes = useStyles();

  const [topRatedPintsInArea, setTopRatedPintsInArea] = useState()
  const [currentLocation, setCurrentLocation] = useState()
  const [currentlySelectedVenue, setCurrentlySelectedVenue] = useState()
  const [locations, setLocations] = useState()
  const [showInfo, setShowInfo] = useState(true)

  const [selected, setSelected] = useState({})
  const onSelect = (item, index) => {
      setSelected(item)
      setShowInfo(index)
  }

  const mapRef = React.useRef()
  const onMapLoad = React.useCallback((map) => {
      mapRef.current = map
  }, [])

  const panTo = React.useCallback(({lat, lng, panLvl}) => {
      setTimeout(() => {
                mapRef.current.panTo({lat, lng})
                mapRef.current.setZoom(panLvl)
      }, 5000)

    }, [])



  useEffect( async () => {

        function success(position) {
              const lat = position.coords.latitude
              const lng = position.coords.longitude
              setTimeout(() => {
                 Geocode.fromLatLng(lat, lng)
                    .then((response) => {
                        setCurrentLocation(response.results[0].address_components[2].long_name)
                        panTo({lat: position.coords.latitude, lng: position.coords.longitude, panLvl:14})
                        if(response.results[0].address_components[2].long_name){
                            getTopRatedPints(response.results[0].address_components[2].long_name)
                        }
                    }, error => {console.error(error)})}, 200)
        }
        function error(){
            // Map pans to a view of the whole of the UK if location is denied by the user
            panTo({lat: 54.071960, lng: -2.864030, panLvl:6})
        }

        await navigator.geolocation.getCurrentPosition(success, error)

      const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'} ,
            body: JSON.stringify({location: currentLocation})
      }

      fetch("http://127.0.0.1:8000/api/get-top-rated-pints-in-area", requestOptions)
         .then((response) => response.json())
         .then((data) => {
             setTopRatedPintsInArea(data)
         })
  }, [])

  function plotLocations(data) {
      let newArray = []
      for (let key in data){
          newArray.push({name: data[key].venue,
                          location: {lat: parseFloat(data[key].lat),
                                     lng: parseFloat(data[key].lng)}})

      }
      setLocations(newArray)
  }

  function getTopRatedPints(location) {
      setLocations(undefined)
      setTimeout(() => {
          //setCurrentLocation(location)
          const requestOptions = {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({location: location})
          }
          fetch("http://127.0.0.1:8000/api/get-top-rated-pints-in-area", requestOptions)
              .then((response) => response.json())
              .then((data) => {
                  setTopRatedPintsInArea(data)
                  console.log(data)
                  plotLocations(data)
              })
      }, 1)
    }


  const mapContainerStyle = {
      width: '100%',
      height: '60vh'
  }
  const center = {
      lat: 53.480759,
      lng: -2.242631
  }
  const options = {
      styles: mapStyles,
      disableDefaultUI: true,
      zoomControl: true
  }

  const position = {
      lat: 53.480759,
      lng: -2.242631
  }

  return (
    <div className={classes.root}>
        {topRatedPintsInArea ?
            <Box>
                <Divider/>
                <br/>
                <Grid container spacing={2}>
                    <Grid item lg={12} md={12} xs={12}>
                        <Search panTo={panTo} getTopRatedPints={getTopRatedPints}
                                              currentLocation={currentLocation}
                                              setCurrentLocation={setCurrentLocation}/>
                    </Grid>
                    <Grid item lg={7} md={12} xs={12}>
                        <Locate panTo={panTo} getTopRatedPints={getTopRatedPints}
                                              currentLocation={currentLocation}
                                              setCurrentLocation={setCurrentLocation}/>
                        <Paper elevation={3}>
                            <div style={{width: '100%', height: '60vh',   border: '2px', borderStyle: 'solid', borderColor: 'grey'}}>
                                {
                                    props.gMapsApiKeyAndLibraryLoaded ?
                                        <GoogleMap mapContainerStyle={mapContainerStyle}
                                                   zoom={14}
                                                   options={options}
                                                   onLoad={onMapLoad}>
                                            {
                                                console.log(locations)
                                            }
                                            {
                                                locations ?
                                                locations.map((item, index) => (
                                                    <Marker key={index}
                                                            position={item.location}
                                                            clickable={true}
                                                            animation='drop'
                                                            label={(index + 1).toString()}
                                                            onClick={(e) =>
                                                            {console.log(item)
                                                             onSelect(item, index)}}
                                                            >
                                                        {
                                                            showInfo === index &&  (<InfoWindow
                                                        position={item.location}
                                                        onCloseClick={() => setShowInfo()}>
                                                        <div>
                                                            <p>{item.name.name}</p>
                                                            <p>({item.name.street})</p>
                                                        </div>
                                                    </InfoWindow>)
                                                        }
                                                    </Marker>
                                                )): null
                                            }
                                            {
                                                locations ?
                                                locations.location && (
                                                    <InfoWindow
                                                        position={selected.location}
                                                        clickable={true}
                                                        onCloseClick={() => setSelected({})}>
                                                        <p>{selected.name}</p>

                                                    </InfoWindow>
                                                ): null

                                            }
                                        </GoogleMap> : null
                                }
                            </div>
                        </Paper>
                    </Grid>
                    <Grid item lg={5} md={12} xs={12}>
                        <Paper style={{height: '60vh',  border: '2px', borderStyle: 'solid', borderColor: 'grey'}}>
                            <Typography
                                className={classes.topPintsAreaText}>
                                {currentLocation ?`Top Rated Pints In ${currentLocation}` : "Search Above to View the Best Pints"}</Typography>
                            <List dense={true} className={classes.topPintsTable}>
                                {
                                    topRatedPintsInArea.length ?
                                        topRatedPintsInArea.map((entry, index) => {
                                            const rankAndBeer = `${entry.rank}. ${entry.beer} (${entry.brewery})`
                                            const venueAndLocation = `${entry.venue.name}, Price: £${entry.price}, (${entry.ratings} Rating/s)`
                                            return (
                                                <ListItem key={index} style={{height: 55}} button dense={true}
                                                          style={showInfo === index ? {backgroundColor: '#f2f2f2'} : null }
                                                          onClick={() => setShowInfo(index)}>
                                                    <ListItemText primary={rankAndBeer} secondary={venueAndLocation}/>
                                                    <ListItemSecondaryAction
                                                        style={{fontWeight: 650}}>{entry.overall_rating}/10</ListItemSecondaryAction>
                                                </ListItem>
                                            )
                                        }) : <Typography style={{display: 'flex', justifyContent: 'center'}}
                                                         >{currentLocation ? "No user submissions yet..." : null} </Typography>
                                }
                            </List>
                        </Paper>
                    </Grid>
                    <br/>
                </Grid>
                <br/>
                <Divider/>
            </Box> :  <CircularProgress className={classes.progressLoader}/>
        }
    </div>
  );
}

function Locate(props) {
    const classes = useStyles()

    return <ExploreIcon className={classes.locate} onClick={() => {
        navigator.geolocation.getCurrentPosition( (position) => {
            Geocode.fromLatLng(position.coords.latitude, position.coords.longitude)
                .then((response) => {
                    props.setCurrentLocation(response.results[0].address_components[2].long_name)
                    props.panTo({lat: position.coords.latitude, lng: position.coords.longitude, panLvl: 14})
                    props.getTopRatedPints(response.results[0].address_components[2].long_name)
                }, error => {console.error(error)})

        }, () => null,)}
    }/>
}

function Search(props){

    const classes = useStyles()

    const {ready, value, suggestions: {status, data}, setValue, clearSuggestions} = usePlaceAutocomplete({
        requestOptions: {location: {lat: () => 53.480759, lng: () => -2.242631}, // auto complete based on users location
                        radius: 400}
    })

    const handleSelect = async (address) => {
        setValue(address, false);
        clearSuggestions()
        try {
            console.log(address)
            const results = await getGeocode({address})
            console.log(results)
            await props.setCurrentLocation(results[0].address_components[0].long_name)
            const {lat, lng} = await getLatLng(results[0])
            props.panTo({lat: lat, lng: lng, panLvl: 14})
            props.getTopRatedPints(results[0].address_components[0].long_name)
        }catch (error){
            console.log("Error:", error)
        }
    }

    return <div>
                <Combobox onSelect={handleSelect}>
                        <ComboboxInput value={value} onChange={(e) => {
                            setValue(e.target.value)}}
                            disabled={!ready}
                            style={{width: '99.5%', height: 50, fontSize: 20, borderStyle: 'solid', borderColor: 'grey'}}
                            placeholder=" Search City"/>
                        <ComboboxPopover>
                            <ComboboxList className={classes.dropDownVenues}>
                                {   status === "OK" && data.map(({description}, index) => (
                                    <ComboboxOption key={index} value={" " + description}><ComboboxOptionText/></ComboboxOption>))
                                }
                            </ComboboxList>
                        </ComboboxPopover>
                </Combobox>
           </div>
}

