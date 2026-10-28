package com.thomas.trouttrot;

import android.annotation.TargetApi;
import android.graphics.Insets;
import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.util.Arrays;

public class MainActivity extends BridgeActivity {

  // With gesture navigation, a swipe in from the left or right screen edge is Android's "back" gesture, and
  // the game is played with swipes that often start near an edge. Asking the system to leave a strip along
  // each side edge to the app lets those swipes reach the game. Android honours at most 200 dp of exclusion
  // per edge, so the strips are 200 dp tall, centred vertically (the rest of the edge still goes back), and as
  // wide as the system's own gesture inset (24 dp or more). Only Android 10 (API 29) and later can do this.
  private static final int STRIP_HEIGHT_DP = 200;
  private static final int MIN_STRIP_WIDTH_DP = 24;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && getBridge() != null) {
      final WebView web = getBridge().getWebView();
      // The strips follow the WebView's size, so refresh them whenever it is laid out (rotation, resizing).
      web.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> updateGestureExclusion(v));
      web.post(() -> updateGestureExclusion(web));
    }
  }

  @Override
  public void onResume() {
    super.onResume();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && getBridge() != null) {
      updateGestureExclusion(getBridge().getWebView());
    }
  }

  @TargetApi(Build.VERSION_CODES.Q)
  private void updateGestureExclusion(View view) {
    final int width = view.getWidth();
    final int height = view.getHeight();
    if (width <= 0 || height <= 0) return;
    final float density = getResources().getDisplayMetrics().density;
    final int minStrip = Math.round(MIN_STRIP_WIDTH_DP * density);
    int left = minStrip;
    int right = minStrip;
    final WindowInsets insets = view.getRootWindowInsets();
    if (insets != null) {
      final Insets gesture = insets.getSystemGestureInsets();
      left = Math.max(left, gesture.left);
      right = Math.max(right, gesture.right);
    }
    final int stripHeight = Math.min(height, Math.round(STRIP_HEIGHT_DP * density));
    final int top = (height - stripHeight) / 2;
    view.setSystemGestureExclusionRects(Arrays.asList(
        new Rect(0, top, left, top + stripHeight),
        new Rect(width - right, top, width, top + stripHeight)));
  }
}
