package com.mycalllogs.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must be called before super.onCreate() so the bridge picks it up
        registerPlugin(CallLogPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
