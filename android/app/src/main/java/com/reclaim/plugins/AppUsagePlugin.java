package com.reclaim.plugins;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "AppUsagePlugin")
public class AppUsagePlugin extends Plugin {

    private static final List<String> SOCIAL_MEDIA_PACKAGES = Arrays.asList(
        "com.instagram.android",
        "com.zhiliaoapp.musically",  // TikTok
        "com.ss.android.ugc.trill",  // TikTok alternative
        "com.google.android.youtube",
        "com.snapchat.android",
        "com.twitter.android",
        "com.facebook.katana",
        "com.facebook.orca",  // Messenger
        "com.whatsapp",
        "com.reddit.frontpage",
        "com.linkedin.android",
        "com.pinterest",
        "com.discord",
        "org.telegram.messenger",
        "com.Slack"
    );

    @PluginMethod
    public void hasPermission(PluginCall call) {
        boolean granted = hasUsageStatsPermission();
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (!hasUsageStatsPermission()) {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        
        // Check again after user might have granted permission
        boolean granted = hasUsageStatsPermission();
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        
        JSArray appsArray = new JSArray();
        
        for (ApplicationInfo app : apps) {
            // Only include user-installed apps (not system apps)
            if ((app.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                JSObject appObj = new JSObject();
                appObj.put("packageName", app.packageName);
                appObj.put("appName", pm.getApplicationLabel(app).toString());
                
                // Determine category
                String category = "Other";
                if (SOCIAL_MEDIA_PACKAGES.contains(app.packageName)) {
                    category = "Social";
                }
                appObj.put("category", category);
                
                appsArray.put(appObj);
            }
        }
        
        JSObject ret = new JSObject();
        ret.put("apps", appsArray);
        call.resolve(ret);
    }

    @PluginMethod
    public void getSocialMediaApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        JSArray appsArray = new JSArray();
        
        for (String packageName : SOCIAL_MEDIA_PACKAGES) {
            try {
                ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);
                JSObject appObj = new JSObject();
                appObj.put("packageName", packageName);
                appObj.put("appName", pm.getApplicationLabel(appInfo).toString());
                appObj.put("category", "Social");
                appsArray.put(appObj);
            } catch (PackageManager.NameNotFoundException e) {
                // App not installed, skip
            }
        }
        
        JSObject ret = new JSObject();
        ret.put("apps", appsArray);
        call.resolve(ret);
    }

    @PluginMethod
    public void getUsageStats(PluginCall call) {
        if (!hasUsageStatsPermission()) {
            call.reject("Usage stats permission not granted");
            return;
        }

        long startTime = call.getLong("startTime", System.currentTimeMillis() - 86400000L);
        long endTime = call.getLong("endTime", System.currentTimeMillis());

        UsageStatsManager usm = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        Map<String, UsageStats> aggregatedStats = usm.queryAndAggregateUsageStats(startTime, endTime);
        
        PackageManager pm = getContext().getPackageManager();
        JSArray statsArray = new JSArray();
        
        for (Map.Entry<String, UsageStats> entry : aggregatedStats.entrySet()) {
            UsageStats stats = entry.getValue();
            
            // Only include apps with actual usage
            if (stats.getTotalTimeInForeground() > 0) {
                JSObject statObj = new JSObject();
                statObj.put("packageName", stats.getPackageName());
                
                // Get app name
                try {
                    ApplicationInfo appInfo = pm.getApplicationInfo(stats.getPackageName(), 0);
                    statObj.put("appName", pm.getApplicationLabel(appInfo).toString());
                } catch (PackageManager.NameNotFoundException e) {
                    statObj.put("appName", stats.getPackageName());
                }
                
                statObj.put("totalTimeInForeground", stats.getTotalTimeInForeground());
                statObj.put("lastTimeUsed", stats.getLastTimeUsed());
                
                statsArray.put(statObj);
            }
        }
        
        JSObject ret = new JSObject();
        ret.put("stats", statsArray);
        call.resolve(ret);
    }

    private boolean hasUsageStatsPermission() {
        AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            getContext().getPackageName()
        );
        return mode == AppOpsManager.MODE_ALLOWED;
    }
}
