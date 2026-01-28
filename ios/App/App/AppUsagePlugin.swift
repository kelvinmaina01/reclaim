import Foundation
import Capacitor

@objc(AppUsagePlugin)
public class AppUsagePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppUsagePlugin"
    public let jsName = "AppUsagePlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "hasPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getInstalledApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSocialMediaApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getUsageStats", returnType: CAPPluginReturnPromise)
    ]
    
    // Known social media bundle identifiers
    private let socialMediaBundleIds = [
        "com.burbn.instagram",
        "com.zhiliaoapp.musically",
        "com.google.ios.youtube",
        "com.toyopagroup.picaboo", // Snapchat
        "com.atebits.Tweetie2", // Twitter/X
        "com.facebook.Facebook",
        "net.whatsapp.WhatsApp",
        "com.reddit.Reddit",
        "com.linkedin.LinkedIn",
        "pinterest",
        "com.hammerandchisel.discord",
        "ph.telegra.Telegraph"
    ]
    
    @objc func hasPermission(_ call: CAPPluginCall) {
        // iOS requires Screen Time API with Family Controls entitlement
        // For now, return true to allow UI to function
        // Real implementation requires Apple entitlement approval
        #if targetEnvironment(simulator)
        call.resolve(["granted": true])
        #else
        // Check if Screen Time is available
        if #available(iOS 15.0, *) {
            // Would check AuthorizationCenter.shared.authorizationStatus
            // Requires FamilyControls framework and entitlement
            call.resolve(["granted": true])
        } else {
            call.resolve(["granted": false])
        }
        #endif
    }
    
    @objc func requestPermission(_ call: CAPPluginCall) {
        #if targetEnvironment(simulator)
        call.resolve(["granted": true])
        #else
        if #available(iOS 15.0, *) {
            // Would call AuthorizationCenter.shared.requestAuthorization
            // Requires FamilyControls framework and entitlement
            call.resolve(["granted": true])
        } else {
            call.resolve(["granted": false])
        }
        #endif
    }
    
    @objc func getInstalledApps(_ call: CAPPluginCall) {
        // iOS doesn't allow querying installed apps for privacy
        // Return common social media apps that user can configure
        var apps: [[String: Any]] = []
        
        let commonApps = [
            ["packageName": "com.burbn.instagram", "appName": "Instagram", "category": "Social"],
            ["packageName": "com.zhiliaoapp.musically", "appName": "TikTok", "category": "Entertainment"],
            ["packageName": "com.google.ios.youtube", "appName": "YouTube", "category": "Entertainment"],
            ["packageName": "com.toyopagroup.picaboo", "appName": "Snapchat", "category": "Social"],
            ["packageName": "com.atebits.Tweetie2", "appName": "X (Twitter)", "category": "Social"],
            ["packageName": "com.facebook.Facebook", "appName": "Facebook", "category": "Social"],
            ["packageName": "net.whatsapp.WhatsApp", "appName": "WhatsApp", "category": "Communication"],
            ["packageName": "com.reddit.Reddit", "appName": "Reddit", "category": "Social"]
        ]
        
        call.resolve(["apps": commonApps])
    }
    
    @objc func getSocialMediaApps(_ call: CAPPluginCall) {
        // Same as getInstalledApps for iOS - returns known social media apps
        let apps = [
            ["packageName": "com.burbn.instagram", "appName": "Instagram", "category": "Social"],
            ["packageName": "com.zhiliaoapp.musically", "appName": "TikTok", "category": "Entertainment"],
            ["packageName": "com.google.ios.youtube", "appName": "YouTube", "category": "Entertainment"],
            ["packageName": "com.toyopagroup.picaboo", "appName": "Snapchat", "category": "Social"],
            ["packageName": "com.atebits.Tweetie2", "appName": "X (Twitter)", "category": "Social"],
            ["packageName": "com.facebook.Facebook", "appName": "Facebook", "category": "Social"],
            ["packageName": "net.whatsapp.WhatsApp", "appName": "WhatsApp", "category": "Communication"],
            ["packageName": "com.reddit.Reddit", "appName": "Reddit", "category": "Social"]
        ]
        
        call.resolve(["apps": apps])
    }
    
    @objc func getUsageStats(_ call: CAPPluginCall) {
        // iOS Screen Time API is required for real usage stats
        // This requires FamilyControls entitlement from Apple
        // For now, return mock data structure
        
        let now = Date().timeIntervalSince1970 * 1000
        
        let stats = [
            [
                "packageName": "com.burbn.instagram",
                "appName": "Instagram",
                "totalTimeInForeground": 1440000, // 24 minutes
                "lastTimeUsed": now - 300000
            ],
            [
                "packageName": "com.zhiliaoapp.musically",
                "appName": "TikTok",
                "totalTimeInForeground": 480000, // 8 minutes
                "lastTimeUsed": now - 600000
            ],
            [
                "packageName": "com.google.ios.youtube",
                "appName": "YouTube",
                "totalTimeInForeground": 720000, // 12 minutes
                "lastTimeUsed": now - 1800000
            ]
        ]
        
        call.resolve(["stats": stats])
    }
}
