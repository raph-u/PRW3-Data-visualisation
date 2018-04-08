/*
 * The purpose of this class is to create JSON files based on data extracted from
 * Swisscom's Open Data portal (https://opendata.swisscom.com/pages/home/)
 * in order to create a visualisation based on it.
 *
 * Here's a list of the files that this class supports:
 *
 * Nombre de SMS envoyés par canton (Juillet 2017): https://opendata.swisscom.com/explore/dataset/nombre-de-sms-envoyes-par-canton-201707/download/?format=json&timezone=Europe/Berlin
 * Nombre d’appels vocaux par canton (Juillet 2017): https://opendata.swisscom.com/explore/dataset/nombre-dappels-vocaux-par-canton-201707/download/?format=json&timezone=Europe/Berlin
 * Téléchargement de données effectif par canton et par heure (Juillet 2017): https://opendata.swisscom.com/explore/dataset/effektiver-datendownload-pro-kanton-und-stunde-fr/download/?format=json&timezone=Europe/Berlin
 *
 * /!\ NOTICE /!\:  Please note that, due to the amount of data contained in each
 * of those files (20k+ records), only information of the 17th of July will be extracted.
 * This will allow the visualisation to be clear and run smoothly by displaying ~ 748 dots VS the aforementioned 20k.
 * 
 */
package prw3.dataparser;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAccessor;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import org.json.*;

/**
 *
 * @author Raph
 */
public class Parser {
    private static boolean firstLineHasBeenWritten = false;
    
    /** 
     * Builds a JSON file by extracting various data from s Swisscom JSON file
     * 
     * @param sourceFilePath The path that leads to one of Swisscom's JSON file
     * @param amountKey The JSON key that holds the number of calls, sms or gigabytes downloaded
     * 
     */
    public static void buildDataFrom(String sourceFilePath, String amountKey) throws IOException {
        String stringData = new String(Files.readAllBytes(Paths.get(sourceFilePath)));
        JSONArray jsonData = new JSONArray(stringData);
        
        String text = "[";
        Files.write(Paths.get(".\\json\\results\\" + amountKey + ".json"), text.getBytes());
        
        jsonData.forEach((record) -> {
            String newLine = parseRecord(record, amountKey);
            
            // Making sure we have data to write into the file
            if (!newLine.equals("")) {
                if (!firstLineHasBeenWritten) {
                    firstLineHasBeenWritten = true;
                } else {
                    newLine = "," + newLine;
                }

                System.out.println("writing: " + newLine);

                writeToJSONFile(".\\json\\results\\" + amountKey + ".json", newLine);
            }
        });
         writeToJSONFile(".\\json\\results\\" + amountKey + ".json", "]");
         
         //Writing process is over, Reset the first line state.
         firstLineHasBeenWritten = false;
    }
    
    /** 
     * Parses a JSONArray element to extract the data we're interested in and build
     * a new JSON object with it. 
     * 
     * @param record a JSONArray element that is beeing iterated over
     * @param amountKey The JSON key that holds the number of calls, sms or gigabytes downloaded
     * 
     * @return a string representation of a new JSON object
     * or an empty string if the record passed as a parameter corresponds to a date other than the 17th of July.
     */
    public static String parseRecord(Object record, String amountKey) {
        // day for which data will be extracted
        int selectedDay = 17;
        
        JSONObject jsonRecord = (JSONObject) record;
        JSONObject fields = jsonRecord.getJSONObject("fields");

        String timestamp = fields.getString("timestamp_hour");
        String canton = fields.getString("canton");
        Integer amount = fields.getInt(amountKey);

        JSONObject extractedData = new JSONObject();
        extractedData.put("canton", canton);
        extractedData.put("timestamp", timestamp);
        extractedData.put("amount", amount);

        DateTimeFormatter timeFormatter = DateTimeFormatter.ISO_DATE_TIME;
        TemporalAccessor accessor = timeFormatter.parse(timestamp);

        Date date = Date.from(Instant.from(accessor));

        LocalDate localDate = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        int year  = localDate.getYear();
        int month = localDate.getMonthValue();
        int day   = localDate.getDayOfMonth();

        // Make sure the data comes from the day we're interested in
        if (day == selectedDay) {
            String dayOfWeek = localDate.getDayOfWeek().toString().toLowerCase();

            Calendar calendar = GregorianCalendar.getInstance();
            calendar.setTime(date);
            int hour = calendar.get(Calendar.HOUR_OF_DAY);

            String hourRange = "";
            String dayperiod = "";

            if (hour >= 0 && hour <= 3) {
                hourRange = "00h - 03h";
            } else if (hour >= 4 && hour <= 7) {
                hourRange = "04h - 07h";
            } else if (hour >= 8 && hour <= 11) {
                hourRange = "08h - 11h";
            } else if (hour >= 12 && hour <= 15) {
                hourRange = "12h - 15h";
            } else if (hour >= 16 && hour <= 19) {
                hourRange = "16h - 19h";
            } else if (hour >= 20 && hour <= 23) {
                hourRange = "20h - 23h";
            }

            if (hour >= 7 && hour <= 19) {
                dayperiod = "day";
            } else {
                dayperiod = "night";
            }

            extractedData.put("dayPeriod", dayperiod);
            extractedData.put("hourRange", hourRange);
            extractedData.put("date", Integer.toString(day) + "." + Integer.toString(month) + "." + Integer.toString(year));
            extractedData.put("hour", hour + "h");
            
            // System.out.println("canton " + canton);
            // System.out.println("timestamp " + timestamp);
            // System.out.println("amount " + SMSesPerHour);
            // System.out.println("dayOfWeek " + dayOfWeek);
            //System.out.println("dayPeriod " + dayperiod);
            // System.out.println("hourRange " + hourRange);

            return extractedData.toString();
        }
        
        return "";
    }
    
    /** 
     * Appends a line (String representation of a JSON object) to a JSON file
     * 
     * @param filePath The path that leads to the new JSON file that is receiving content
     * @param content The actual String representation of a JSON object to append to the file
     * 
     */
    public static void writeToJSONFile(String filePath, String content) {
        try {
            Files.write(Paths.get(filePath), content.getBytes(), StandardOpenOption.APPEND);
        } catch (IOException e) {
            // exception handling
            System.out.println("A problem occured while writting to " + filePath);
        }
    }
}
