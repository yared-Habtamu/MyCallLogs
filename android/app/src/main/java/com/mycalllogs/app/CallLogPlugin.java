package com.mycalllogs.app;

import android.Manifest;
import android.database.Cursor;
import android.provider.CallLog;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PermissionState;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "CallLogReader",
    permissions = {
        @Permission(
            strings = { Manifest.permission.READ_CALL_LOG },
            alias = "callLog"
        )
    }
)
public class CallLogPlugin extends Plugin {

    @PluginMethod
    public void getCallLogs(PluginCall call) {
        if (!getPermissionState("callLog").equals(PermissionState.GRANTED)) {
            requestPermissionForAlias("callLog", call, "callLogPermissionCallback");
            return;
        }
        readCalls(call);
    }

    @PermissionCallback
    private void callLogPermissionCallback(PluginCall call) {
        if (getPermissionState("callLog").equals(PermissionState.GRANTED)) {
            readCalls(call);
        } else {
            call.reject(
                "READ_CALL_LOG permission was denied by the user",
                "PERMISSION_DENIED"
            );
        }
    }

    private void readCalls(PluginCall call) {
        Integer limitArg = call.getInt("limit");
        int limit = limitArg != null ? limitArg : 0; // 0 = all rows

        String[] projection = new String[] {
            CallLog.Calls.NUMBER,
            CallLog.Calls.CACHED_NAME,
            CallLog.Calls.DURATION,
            CallLog.Calls.DATE,
            CallLog.Calls.TYPE
        };

        JSArray calls = new JSArray();
        Cursor cursor = null;
        try {
            cursor = getContext().getContentResolver().query(
                CallLog.Calls.CONTENT_URI,
                projection,
                null,
                null,
                CallLog.Calls.DATE + " DESC"
            );
            if (cursor == null) {
                call.reject("Call log provider unavailable on this device", "UNAVAILABLE");
                return;
            }

            int iNumber = cursor.getColumnIndexOrThrow(CallLog.Calls.NUMBER);
            int iName = cursor.getColumnIndexOrThrow(CallLog.Calls.CACHED_NAME);
            int iDuration = cursor.getColumnIndexOrThrow(CallLog.Calls.DURATION);
            int iDate = cursor.getColumnIndexOrThrow(CallLog.Calls.DATE);
            int iType = cursor.getColumnIndexOrThrow(CallLog.Calls.TYPE);

            int rowCount = 0;
            while (cursor.moveToNext() && (limit == 0 || rowCount < limit)) {
                JSObject row = new JSObject();
                row.put("number", cursor.getString(iNumber));
                row.put("name", cursor.isNull(iName) ? null : cursor.getString(iName));
                row.put("duration", cursor.getInt(iDuration));   // seconds
                row.put("timestamp", cursor.getLong(iDate));      // epoch ms
                row.put("type", cursor.getInt(iType));
                row.put("typeLabel", typeLabel(cursor.getInt(iType)));
                calls.put(row);
                rowCount++;
            }
        } catch (SecurityException e) {
            call.reject("Missing READ_CALL_LOG permission", "PERMISSION_DENIED");
            return;
        } catch (Exception e) {
            call.reject("Failed to read call log: " + e.getMessage(), "QUERY_FAILED");
            return;
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        JSObject result = new JSObject();
        result.put("calls", calls);
        call.resolve(result);
    }

    private String typeLabel(int type) {
        switch (type) {
            case CallLog.Calls.INCOMING_TYPE:
                return "incoming";
            case CallLog.Calls.OUTGOING_TYPE:
                return "outgoing";
            case CallLog.Calls.MISSED_TYPE:
                return "missed";
            case CallLog.Calls.REJECTED_TYPE:
                return "rejected";
            case CallLog.Calls.BLOCKED_TYPE:
                return "blocked";
            case CallLog.Calls.VOICEMAIL_TYPE:
                return "voicemail";
            default:
                return "other";
        }
    }
}
