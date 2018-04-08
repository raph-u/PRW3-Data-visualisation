/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package prw3.dataparser;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import static prw3.dataparser.Parser.buildDataFrom;

/**
 *
 * @author Raph
 */
public class PRW3DataParser {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {
         try {
            String downloadsFilePath = ".\\json\\effektiver-datendownload-pro-kanton-und-stunde-fr.json";
            String callsFilePath = ".\\json\\nombre-dappels-vocaux-par-canton-201707.json";
            String SMSesFilePath = ".\\json\\nombre-de-sms-envoyes-par-canton-201707.json";

            buildDataFrom(downloadsFilePath, "effective_bytes_down_per_canton_per_hour_gb");
            buildDataFrom(callsFilePath, "number_calls_per_canton_per_hour");
            buildDataFrom(SMSesFilePath, "number_sms_per_canton_per_hour");
        } catch (IOException ex) {
            Logger.getLogger(PRW3DataParser.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
}
