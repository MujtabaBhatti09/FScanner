/*
 * Copyright (C) 2009 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.fgtit.reader;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.io.UnsupportedEncodingException;
import java.util.Timer;
import java.util.TimerTask;

import com.fgtit.reader.R;
import com.fgtit.data.Conversions;
import com.fgtit.data.fpimage;
import com.fgtit.data.wsq;
import com.fgtit.fpcore.FPMatch;

import android.util.Base64;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Message;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.Window;
import android.view.View.OnClickListener;
import android.view.inputmethod.EditorInfo;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

/**
 * This is the main Activity that displays the current chat session.
 */
public class BluetoothReader extends Activity {
    // Debugging
    private static final String TAG = "BluetoothReader";
    private static final boolean D = true;
    
    private final static byte CMD_PASSWORD=0x01;	//Password
    private final static byte CMD_ENROLID=0x02;		//Enroll in Device
    private final static byte CMD_VERIFY=0x03;		//Verify in Device
    private final static byte CMD_IDENTIFY=0x04;	//Identify in Device
    private final static byte CMD_DELETEID=0x05;	//Delete in Device
    private final static byte CMD_CLEARID=0x06;		//Clear in Device
    private final static byte CMD_ENROLHOST=0x07;	//Enroll to Host
    private final static byte CMD_CAPTUREHOST=0x08;	//Caputre to Host
    private final static byte CMD_MATCH=0x09;		//Match
    private final static byte CMD_WRITEFPCARD=0x0A;	//Write Card Data
    private final static byte CMD_READFPCARD=0x0B;	//Read Card Data
    private final static byte CMD_CARDSN=0x0E;		//Read Card Sn
    private final static byte CMD_GETSN=0x10;
    
    private final static byte CMD_FPCARDMATCH=0x13;    
    private final static byte CMD_WRITEDATACARD = 0x14;    //Write Card Data
    private final static byte CMD_READDATACARD = 0x15;     //Read Card Data
    
    private final static byte CMD_GETBAT=0x21;
    
    private final static byte CMD_GETIMAGE=0x30;
    private final static byte CMD_GETCHAR=0x31;
    private final static byte CMD_UPCARDSN=0x43;
    
    private final static byte CMD_SETTIMEOUT=0x50;
    private final static byte CMD_STOPWORK=0x51;
    
    private byte mDeviceCmd=0x00;
    private boolean mIsWork=false;
    private byte  mCmdData[]=new byte[10240];
    private int	  mCmdSize=0;
    
    private Timer mTimerTimeout=null; 
    private TimerTask mTaskTimeout=null;     
    private Handler mHandlerTimeout;
        
    // Message types sent from the BluetoothChatService Handler
    public static final int MESSAGE_STATE_CHANGE = 1;
    public static final int MESSAGE_READ = 2;
    public static final int MESSAGE_WRITE = 3;
    public static final int MESSAGE_DEVICE_NAME = 4;
    public static final int MESSAGE_TOAST = 5;

    // Key names received from the BluetoothChatService Handler
    public static final String DEVICE_NAME = "device_name";
    public static final String TOAST = "toast";

    // Intent request codes
    private static final int REQUEST_CONNECT_DEVICE = 1;
    private static final int REQUEST_ENABLE_BT = 2;

    // Layout Views
    private TextView mTitle;
    private ListView mConversationView;
    private ImageView fingerprintImage;
            
    // Name of the connected device
    private String mConnectedDeviceName = null;
    // Array adapter for the conversation thread
    private ArrayAdapter<String> mConversationArrayAdapter;
    // String buffer for outgoing messages
    private StringBuffer mOutStringBuffer;
    // Local Bluetooth adapter
    private BluetoothAdapter mBluetoothAdapter = null;
    // Member object for the chat services
    private BluetoothReaderService mReaderService = null;
    
    public byte mRefData[]=new byte[512];
    public int mRefSize=0;
    public byte mMatData[]=new byte[512];
    public int mMatSize=0;

    public byte mRefList[][]=new byte[2048][512];
    public int	mRefCount=0;
    
    public byte mCardSn[]=new byte[4];
    public byte mCardData[]=new byte[4096];
    public int mCardSize=0;

    public byte mBat[]=new byte[2];
    public byte mUpImage[]=new byte[73728];//36864
    public int mUpImageSize=0;
    
    //
    public byte mRefCoord[]=new byte[512];
    public byte mMatCoord[]=new byte[512];
    
    public byte mIsoData[]=new byte[378];
        
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if(D) Log.e(TAG, "+++ ON CREATE +++");

        // Set up the window layout
        requestWindowFeature(Window.FEATURE_CUSTOM_TITLE);
        setContentView(R.layout.main);
        getWindow().setFeatureInt(Window.FEATURE_CUSTOM_TITLE, R.layout.custom_title);

        // Set up the custom title
        mTitle = (TextView) findViewById(R.id.title_left_text);
        mTitle.setText(R.string.app_name);
        mTitle = (TextView) findViewById(R.id.title_right_text);

        // Get local Bluetooth adapter
        mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

        // If the adapter is null, then Bluetooth is not supported
        if (mBluetoothAdapter == null) {
            Toast.makeText(this, "Bluetooth is not available", Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        
        
        if(FPMatch.getInstance().InitMatch(0, "http://www.fgtit.com/")!=1){
        	Toast.makeText(this, "Init Matcher Fail!", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if(D) Log.e(TAG, "++ ON START ++");

        // If BT is not on, request that it be enabled.
        // setupChat() will then be called during onActivityResult
        if (!mBluetoothAdapter.isEnabled()) {
            Intent enableIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            startActivityForResult(enableIntent, REQUEST_ENABLE_BT);
        // Otherwise, setup the chat session
        } else {
            if (mReaderService == null) setupChat();
        }
    }

    @Override
    public synchronized void onResume() {
        super.onResume();
        if(D) Log.e(TAG, "+ ON RESUME +");

        // Performing this check in onResume() covers the case in which BT was
        // not enabled during onStart(), so we were paused to enable it...
        // onResume() will be called when ACTION_REQUEST_ENABLE activity returns.
        if (mReaderService != null) {
            // Only if the state is STATE_NONE, do we know that we haven't started already
            if (mReaderService.getState() == BluetoothReaderService.STATE_NONE) {
              // Start the Bluetooth chat services
              mReaderService.start();
            }
        }
    }

    private void setupChat() {
        Log.d(TAG, "setupChat()");

        // Initialize the array adapter for the conversation thread
        mConversationArrayAdapter = new ArrayAdapter<String>(this, R.layout.message);
        mConversationView = (ListView) findViewById(R.id.in);
        mConversationView.setAdapter(mConversationArrayAdapter);
        
        fingerprintImage=(ImageView)findViewById(R.id.imageView1);
                  
        final Button mButton1 = (Button) findViewById(R.id.button1);
        mButton1.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	int id=2;
            	byte buf[]=new byte[2];
            	buf[0]=(byte)(id);
            	buf[1]=(byte)(id>>8);            			
            	SendCommand(CMD_ENROLID,buf,2);
            }
        });
        
        final Button mButton2 = (Button) findViewById(R.id.button2);
        mButton2.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	int id=2;
            	byte buf[]=new byte[2];
            	buf[0]=(byte)(id);
            	buf[1]=(byte)(id>>8);            			
            	SendCommand(CMD_VERIFY,buf,2);
            }
        });
        
        final Button mButton3 = (Button) findViewById(R.id.button3);
        mButton3.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	SendCommand(CMD_IDENTIFY,null,0);
            }
        });

        final Button mButton4 = (Button) findViewById(R.id.button4);
        mButton4.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	int id=2;
            	byte buf[]=new byte[2];
            	buf[0]=(byte)(id);
            	buf[1]=(byte)(id>>8); 
            	SendCommand(CMD_DELETEID,buf,2);
            }
        });
        
        final Button mButton5 = (Button) findViewById(R.id.button5);
        mButton5.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	SendCommand(CMD_CLEARID,null,0);
            }
        });
        
        final Button mButton6 = (Button) findViewById(R.id.button6);
        mButton6.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	SendCommand(CMD_ENROLHOST,null,0);
            }
        });
        
        final Button mButton7 = (Button) findViewById(R.id.button7);
        mButton7.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	SendCommand(CMD_CAPTUREHOST,null,0);
            }
        });
        
        final Button mButton8 = (Button) findViewById(R.id.button8);
        mButton8.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	//Match In Host
            	for(int i=0;i<mRefCount;i++){
            		int score=FPMatch.getInstance().MatchFingerData(mRefList[i],mMatData);
            		if(score>50){
            			AddStatusList("Index:"+String.valueOf(i+1)+"   Match Score:"+String.valueOf(score));
            			return;
            		}            			
            	}
            	
            	AddStatusList("No Match");
            }
        });
        
        final Button mButton20 = (Button) findViewById(R.id.button20);
        mButton20.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	//Match In Device
            	byte buf[]=new byte[1024];
            	memcpy(buf,0,mRefData,0,512);
            	memcpy(buf,512,mMatData,0,512);
            	System.arraycopy(mRefData, 0, buf, 0, 512);
            	System.arraycopy(mMatData, 0, buf, 512, 256);            	
            	SendCommand(CMD_MATCH,buf,1024);
            }
        });
                
        final Button mButton9 = (Button) findViewById(R.id.button9);
        mButton9.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	byte buf[]=new byte[2048];
            	memcpy(buf,0,mRefList[0],0,512);
            	memcpy(buf,512,mRefList[1],0,512);
            	//SendCommand(CMD_WRITECARD,mCardData,1024);
            	String str="Test";
            	byte tb[]=str.getBytes();
            	memcpy(buf,1024,tb,0,tb.length);
            	SendCommand(CMD_WRITEFPCARD,buf,1024+tb.length);
            }
        });
        
        final Button mButton10 = (Button) findViewById(R.id.button10);
        mButton10.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	SendCommand(CMD_READFPCARD,null,0);
            }
        });
        
        final Button mButton11 = (Button) findViewById(R.id.button11);
        mButton11.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	byte buf[]=new byte[1024];
            	String str="ABC Test Android";
            	byte tb[]=str.getBytes();
            	memcpy(buf,0,tb,0,tb.length);
            	SendCommand(CMD_WRITEDATACARD,buf,tb.length);
            }
        });
        
        final Button mButton12 = (Button) findViewById(R.id.button12);
        mButton12.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	SendCommand(CMD_READDATACARD,null,0);
            }
        });
        
        final Button mButton13 = (Button) findViewById(R.id.button13);
        mButton13.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	SendCommand(CMD_CARDSN,null,0);
            }
        });
        
        final Button mButton14 = (Button) findViewById(R.id.button14);
        mButton14.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	//byte pbcode[]=PrinterApi.TextOutEx("Printer Test\n",0,0,0,0,0);
            	//SendCommand(CMD_PRINTCMD,pbcode,pbcode.length);
            	SendCommand(CMD_GETSN,null,0);
            }
        });
        
        final Button mButton15 = (Button) findViewById(R.id.button15);
        mButton15.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	//byte pbcode[]=PrinterApi.SetBarcode("012345",0,PrinterCmd.Constant.BARCODE_TYPE_CODE39, 2,120, 0,2);            	
            	//SendCommand(CMD_PRINTCMD,pbcode,pbcode.length);
            	SendCommand(CMD_GETBAT,null,0);
            }
        });
        
        final Button mButton16 = (Button) findViewById(R.id.button16);
        mButton16.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	SendCommand(CMD_GETIMAGE,null,0);
            }
        });
        
        final Button mButton17 = (Button) findViewById(R.id.button17);
        mButton17.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	SendCommand(CMD_GETCHAR,null,0);           	
            }
        });
        
        final Button mButton18 = (Button) findViewById(R.id.button18);
        mButton18.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
            	SendCommand(CMD_FPCARDMATCH,null,0);
            }
        });
        
        final Button mButton19=(Button)findViewById(R.id.button19);
        mButton19.setOnClickListener(new OnClickListener(){
        	public void onClick(View v) {
        		SendCommandEx(CMD_STOPWORK,null,0);
            }
        });
        
        mReaderService = new BluetoothReaderService(this, mHandler);	// Initialize the BluetoothChatService to perform bluetooth connections
        mOutStringBuffer = new StringBuffer("");	        		// Initialize the buffer for outgoing messages
        
        
        SharedPreferences sp;
		sp = PreferenceManager.getDefaultSharedPreferences(this);
		String address =sp.getString("device","");
		if(address.length()>2){
			BluetoothDevice device = mBluetoothAdapter.getRemoteDevice(address);
			mReaderService.connect(device);
		}
    }

    @Override
    public synchronized void onPause() {
        super.onPause();
    }

    @Override
    public void onStop() {
        super.onStop();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // Stop the Bluetooth chat services
        if (mReaderService != null) mReaderService.stop();
    }

    private void ensureDiscoverable() {
        if(D) Log.d(TAG, "ensure discoverable");
        if (mBluetoothAdapter.getScanMode() !=
            BluetoothAdapter.SCAN_MODE_CONNECTABLE_DISCOVERABLE) {
            Intent discoverableIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE);
            discoverableIntent.putExtra(BluetoothAdapter.EXTRA_DISCOVERABLE_DURATION, 300);
            startActivity(discoverableIntent);
        }
    }

    private void AddStatusList(String text) {
    	mConversationArrayAdapter.add(text);
    }
    
    private void AddStatusListHex(byte[] data,int size) {
    	String text="";    	
    	for(int i=0;i<size;i++) {
    		text=text+","+Integer.toHexString(data[i]&0xFF).toUpperCase();
    	}
    	mConversationArrayAdapter.add(text);
    }
	
	private void memcpy(byte[] dstbuf,int dstoffset,byte[] srcbuf,int srcoffset,int size) {
		for(int i=0;i<size;i++) {
			dstbuf[dstoffset+i]=srcbuf[srcoffset+i];
		}
	}
	
	private int calcCheckSum(byte[] buffer,int size) {
		int sum=0;
		for(int i=0;i<size;i++) {
			sum=sum+buffer[i];
		}
		return (sum & 0x00ff);
	}
	
	public void TimeOutStart() {
	   	 if(mTimerTimeout!=null){
	   		 return;
	   	 }
	   	 mTimerTimeout = new Timer(); 
	   	 mHandlerTimeout = new Handler() { 
				@Override 
				public void handleMessage(Message msg) { 
					TimeOutStop();
					if(mIsWork){
						mIsWork=false;
						AddStatusList("Time Out");
					}
	               super.handleMessage(msg); 
	            }
	        };
	        mTaskTimeout = new TimerTask() { 
	            @Override 
	            public void run() { 
	                Message message = new Message(); 
	                message.what = 1; 
	                mHandlerTimeout.sendMessage(message); 
	            } 
	        }; 
	        mTimerTimeout.schedule(mTaskTimeout, 10000, 10000); 
	}
	
	public void TimeOutStop() {
    	if (mTimerTimeout!=null) {  
    		mTimerTimeout.cancel();  
    		mTimerTimeout = null;  
    		mTaskTimeout.cancel();
    		mTaskTimeout=null;
		}
    }
	
	private void SendCommandEx(byte cmdid,byte[] data,int size) {
    	
    	int sendsize=9+size;
    	byte[] sendbuf = new byte[sendsize];
    	sendbuf[0]='F';
    	sendbuf[1]='T';
    	sendbuf[2]=0;
    	sendbuf[3]=0;
    	sendbuf[4]=cmdid;
    	sendbuf[5]=(byte)(size);
    	sendbuf[6]=(byte)(size>>8);
    	if(size>0) {
    		for(int i=0;i<size;i++) {
    			sendbuf[7+i]=data[i];
    		}
    	}
    	int sum=calcCheckSum(sendbuf,(7+size));
    	sendbuf[7+size]=(byte)(sum);
    	sendbuf[8+size]=(byte)(sum>>8);
   	
    	mDeviceCmd=cmdid;
    	mCmdSize=0;
    	mReaderService.write(sendbuf);
    	
		AddStatusList("Stop Work ...");
    }
	
    private void SendCommand(byte cmdid,byte[] data,int size) {
    	if(mIsWork)return;
    	
    	int sendsize=9+size;
    	byte[] sendbuf = new byte[sendsize];
    	sendbuf[0]='F';
    	sendbuf[1]='T';
    	sendbuf[2]=0;
    	sendbuf[3]=0;
    	sendbuf[4]=cmdid;
    	sendbuf[5]=(byte)(size);
    	sendbuf[6]=(byte)(size>>8);
    	if(size>0) {
    		for(int i=0;i<size;i++) {
    			sendbuf[7+i]=data[i];
    		}
    	}
    	int sum=calcCheckSum(sendbuf,(7+size));
    	sendbuf[7+size]=(byte)(sum);
    	sendbuf[8+size]=(byte)(sum>>8);
    	
    	mIsWork=true;
    	TimeOutStart();
    	mDeviceCmd=cmdid;
    	mCmdSize=0;
    	mReaderService.write(sendbuf);
    	    	
    	switch(sendbuf[4]) {
		case CMD_PASSWORD:	//密码
			break;
		case CMD_ENROLID:	//登记到设备
				AddStatusList("Enrol ID ...");
			break;
		case CMD_VERIFY:	//在设备验证
				AddStatusList("Verify ID ...");
			break;
		case CMD_IDENTIFY:	//在设备搜索
				AddStatusList("Search ID ...");
			break;
		case CMD_DELETEID:
				AddStatusList("Delete ID ...");
			break;
		case CMD_CLEARID:
				AddStatusList("Clear ...");
			break;
		case CMD_ENROLHOST:	//登记到主机
				AddStatusList("Enrol Template ...");
			break;
		case CMD_CAPTUREHOST:	//采集到主机
				AddStatusList("Capture Template ...");
			break;
		case CMD_MATCH:	//比对
				AddStatusList("Match Template ...");
			break;
		case CMD_WRITEFPCARD:	//写卡
		case CMD_WRITEDATACARD:
				AddStatusList("Write Card ...");
			break;
		case CMD_READFPCARD:	//读卡
		case CMD_READDATACARD:
				AddStatusList("Read Card ...");
			break;
		case CMD_FPCARDMATCH:
				AddStatusList("FingerprintCard Match ...");
			break;			
		case CMD_CARDSN:		//读卡序列号
				AddStatusList("Read Card SN ...");
			break;
		case CMD_GETSN:
				AddStatusList("Get Device SN ...");
			break;
		case CMD_GETBAT:
				AddStatusList("Get Battery Value ...");
			break;
		case CMD_GETIMAGE:
				mUpImageSize=0;
				AddStatusList("Get Fingerprint Image ...");
			break;
		case CMD_GETCHAR:
			AddStatusList("Get Fingerprint Data ...");
			break;
		}
    }
    
    private byte[] changeByte(int data) {
		byte b4 = (byte) ((data) >> 24);
		byte b3 = (byte) (((data) << 8) >> 24);
		byte b2 = (byte) (((data) << 16) >> 24);
		byte b1 = (byte) (((data) << 24) >> 24);
		byte[] bytes = { b1, b2, b3, b4 };
		return bytes;
	}
    
    private byte[] toBmpByte(int width, int height, byte[] data) {
		byte[] buffer = null;
		try {
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			DataOutputStream dos = new DataOutputStream(baos);

			int bfType = 0x424d;
			int bfSize = 54 + 1024 + width * height;
			int bfReserved1 = 0;
			int bfReserved2 = 0;
			int bfOffBits = 54 + 1024;

			dos.writeShort(bfType);
			dos.write(changeByte(bfSize), 0, 4);
			dos.write(changeByte(bfReserved1), 0, 2);
			dos.write(changeByte(bfReserved2), 0, 2);
			dos.write(changeByte(bfOffBits), 0, 4);

			int biSize = 40;
			int biWidth = width;
			int biHeight = height;
			int biPlanes = 1;
			int biBitcount = 8;
			int biCompression = 0;
			int biSizeImage = width * height;
			int biXPelsPerMeter = 0;
			int biYPelsPerMeter = 0;
			int biClrUsed = 256;
			int biClrImportant = 0;

			dos.write(changeByte(biSize), 0, 4);
			dos.write(changeByte(biWidth), 0, 4);
			dos.write(changeByte(biHeight), 0, 4);
			dos.write(changeByte(biPlanes), 0, 2);
			dos.write(changeByte(biBitcount), 0, 2);
			dos.write(changeByte(biCompression), 0, 4);
			dos.write(changeByte(biSizeImage), 0, 4);
			dos.write(changeByte(biXPelsPerMeter), 0, 4);
			dos.write(changeByte(biYPelsPerMeter), 0, 4);
			dos.write(changeByte(biClrUsed), 0, 4);
			dos.write(changeByte(biClrImportant), 0, 4);

			byte[] palatte = new byte[1024];
			for (int i = 0; i < 256; i++) {
				palatte[i * 4] = (byte) i;
				palatte[i * 4 + 1] = (byte) i;
				palatte[i * 4 + 2] = (byte) i;
				palatte[i * 4 + 3] = 0;
			}
			dos.write(palatte);

			dos.write(data);
			dos.flush();
			buffer = baos.toByteArray();
			dos.close();
			baos.close();
		} catch (Exception e) {
			e.printStackTrace();
		}
		return buffer;
	}
    
    public byte[] getFingerprintImage(byte[] data,int width,int height) {
		if (data == null) {
			return null;
		}
		byte[] imageData = new byte[width*height * 2];
		for (int i = 0; i < (width*height); i++) {
			imageData[i * 2] = (byte) (data[i] & 0xf0);
			imageData[i * 2 + 1] = (byte) (data[i] << 4 & 0xf0);
		}
		byte[] bmpData = toBmpByte(width, height, imageData);
		return bmpData;
	}
    
    public byte[] getRawImage(byte[] data,int width,int height) {
		if (data == null) {
			return null;
		}
		byte[] imageData = new byte[width*height * 2];
		for (int i = 0; i < (width*height); i++) {
			imageData[i * 2] = (byte) (data[i] & 0xf0);
			imageData[i * 2 + 1] = (byte) (data[i] << 4 & 0xf0);
		}
		return imageData;
	}
    
    private void ReceiveCommand(byte[] databuf,int datasize) { 
    	if(mDeviceCmd==CMD_GETIMAGE) {
    		memcpy(mUpImage,mUpImageSize,databuf,0,datasize);
			mUpImageSize=mUpImageSize+datasize;
			if(mUpImageSize>=15200){
				/*
				byte[] bmpdata=getFingerprintImage(mUpImage,152,200);
				Bitmap image = BitmapFactory.decodeByteArray(bmpdata, 0,bmpdata.length);
				fingerprintImage.setImageBitmap(image);
				mUpImageSize=0;
				mIsWork=false;
				AddStatusList("Display Image");
				*/
				
				//Small Image
				/*
				byte[] bmpdata=getFingerprintImage(mUpImage,152,200);
				Bitmap image = BitmapFactory.decodeByteArray(bmpdata, 0,bmpdata.length);
				fingerprintImage.setImageBitmap(image);
				*/
				//Std Image
				byte[] opImage=new byte[256*288];
				fpimage.getInstance().ToStdImage(mUpImage, opImage);
				byte[] bmpdata=toBmpByte(256,288,opImage);
				Bitmap image = BitmapFactory.decodeByteArray(bmpdata, 0,bmpdata.length);
				fingerprintImage.setImageBitmap(image);
				
				//PNG
	 			SavePngFile(image,"fp.png");
	 			//WSQ
	 			byte[] inpdata=new byte[73728];
	 			int inpsize=73728;
	 			System.arraycopy(bmpdata,1078, inpdata, 0, inpsize);
	 			SaveWsqFile(inpdata,inpsize,"fp.wsq");
	 			
	 			
				mUpImageSize=0;
				mIsWork=false;
				AddStatusList("Display Image");
				
				/*
				try {
					Thread.currentThread();
					Thread.sleep(200);
				}catch (InterruptedException e){
					e.printStackTrace();
				}
				
				SendCommand(CMD_GETCHAR,null,0);
				*/
			}
   		}else{
 			memcpy(mCmdData,mCmdSize,databuf,0,datasize);
   	   		mCmdSize=mCmdSize+datasize;   			
   			int totalsize=(byte)(mCmdData[5])+((mCmdData[6]<<8)&0xFF00)+9;   			
   			if(mCmdSize>=totalsize){
   				mCmdSize=0;
   				mIsWork=false;
   		    	if((mCmdData[0]=='F')&&(mCmdData[1]=='T'))	{
   		    		switch(mCmdData[4]) {
   		    		case CMD_PASSWORD: {    				
   		    			}
   		    			break;
   		    		case CMD_ENROLID: {
   		    				if(mCmdData[7]==1) {
   		    					//int id=mCmdData[8]+(mCmdData[9]<<8);
   		    					int id=(byte)(mCmdData[8])+(byte)((mCmdData[9]<<8)&0xFF00);
   		    					AddStatusList("Enrol Succeed:"+String.valueOf(id));
   		    				}
   		    				else
   		    					AddStatusList("Enrol Fail");
   		    					
   		    			}
   		    			break;
   		    		case CMD_VERIFY: {
   		    				if(mCmdData[7]==1)
   		    					AddStatusList("Verify Succeed");
   		    				else
   		    					AddStatusList("Verify Fail");
   		    			}
   		    			break;
   		    		case CMD_IDENTIFY: {
   		    				if(mCmdData[7]==1) {
   		    					int id=(byte)(mCmdData[8])+(byte)((mCmdData[9]<<8)&0xFF00);
   		    					//int id=mCmdData[8]+(mCmdData[9]<<8);
   		        				AddStatusList("Search Result:"+String.valueOf(id));
   		    				} else
   		    					AddStatusList("Search Fail");
   		    			}
   		    			break;
   		    		case CMD_DELETEID:
   		    			{
   		    				if(mCmdData[7]==1)
   		    					AddStatusList("Delete Succeed");
   		    				else
   		    					AddStatusList("Delete Fail");
   		    			}
   		    			break;
   		    		case CMD_CLEARID: {
   		    				if(mCmdData[7]==1)
   		    					AddStatusList("Clear Succeed");
   		    				else
   		    					AddStatusList("Clear Fail");
   		    			}
   		    			break;
   		    		case CMD_ENROLHOST: {
   		    				int size=(byte)(mCmdData[5])+((mCmdData[6]<<8)&0xFF00)-1;
   		    				if(mCmdData[7]==1) {
   		    					memcpy(mRefData,0,mCmdData,8,size);
   		    					mRefSize=size;
	    						if(mRefCount<2048){
	    							memcpy(mRefList[mRefCount],0,mCmdData,8,size);
	    							AddStatusListHex(mRefList[mRefCount],256);
	    							mRefCount++;
	    						}
   		    					AddStatusList("Count="+String.valueOf(mRefCount));
   		    					AddStatusList("Enrol Succeed");
   		    				   		    					
   		    				}else
   		    					AddStatusList("Enrol Fail");
   		    			}
   		    			break;
   		    		case CMD_CAPTUREHOST: {
   		    				int size=(byte)(mCmdData[5])+((mCmdData[6]<<8)&0xFF00)-1;
   		    				if(mCmdData[7]==1) {
   		    					memcpy(mMatData,0,mCmdData,8,size);
   		    					mMatSize=size;
   		    					AddStatusList("Capture Succeed");
   		    					
    							Conversions.getInstance().StdToIso(2,mMatData,mIsoData);        					
    							String bsiso=Base64.encodeToString(mIsoData,0,378,Base64.DEFAULT);
    							File file=new File("/sdcard/savedat.txt");
    							
    							
    					    	try {
    					    		file.createNewFile();
    								FileOutputStream out=new FileOutputStream(file);
    								out.write(bsiso.getBytes());
    								out.close();
    							} catch (IOException e) {
    								e.printStackTrace();
    							}
    					    	
    					    	AddStatusListHex(mMatData,256);
   		    				}
   		    				else
   		    					AddStatusList("Capture Fail");
   		    			}
   		    			break;
   		    		case CMD_MATCH:	{
   		    				int score=(byte)(mCmdData[8])+((mCmdData[9]<<8)&0xFF00);
   		    				if(mCmdData[7]==1)
   		    					AddStatusList("Match Succeed:"+String.valueOf(score));
   		    				else
   		    					AddStatusList("Match Fail");
   		    			}
   		    			break;
   		    		case CMD_WRITEFPCARD: {
   		    				if(mCmdData[7]==1)
   		    					AddStatusList("Write Fingerprint Card Succeed");
   		    				else
   		    					AddStatusList("Write Fingerprint Card Fail");
   		    			}
   		    			break;
   		    		case CMD_READFPCARD: {
   		    				int size=(byte)(mCmdData[5])+((mCmdData[6]<<8)&0xFF00);
   		    				if(size>0)
   		    				{
   		    					memcpy(mCardData,0,mCmdData,8,size);
   		    					mCardSize=size;
   		    					AddStatusList("Read Fingerprint Card Succeed");
   		    				}
   		    				else
   		    					AddStatusList("Read Fingerprint Card Fail");
   		    			}
   		    			break;
   		    		case CMD_FPCARDMATCH:{
   		    				if(mCmdData[7]==1){
								AddStatusList("Fingerprint Match Succeed");								
   		    					int size=(byte)(mCmdData[5])+((mCmdData[6]<<8)&0xFF00)-1;
   		    					byte[] tmpbuf=new byte[size];
   		    					memcpy(tmpbuf,0,mCmdData,8,size);
   		    					AddStatusList("Len="+String.valueOf(size));
   		    					AddStatusListHex(tmpbuf,size);
   		    					String txt=new String(tmpbuf);
   		    					AddStatusList(txt);
   		    				}
							else
								AddStatusList("Fingerprint Match Fail");
   		    			}
   		    			break;
   		    		case CMD_UPCARDSN:
   		    		case CMD_CARDSN: {
   		    				int size=(byte)(mCmdData[5])+((mCmdData[6]<<8)&0xF0)-1;
   		    				if(size>0) {
   		    					memcpy(mCardSn,0,mCmdData,8,size);    			    					
   		    					AddStatusList("Read Card SN Succeed:"+Integer.toHexString(mCardSn[0]&0xFF)+Integer.toHexString(mCardSn[1]&0xFF)+Integer.toHexString(mCardSn[2]&0xFF)+Integer.toHexString(mCardSn[3]&0xFF));
   		    				}
   		    				else
   		    					AddStatusList("Read Card SN Fail");
   		    			}
   		    			break;
   		    		case CMD_WRITEDATACARD: {
		    				if(mCmdData[7]==1)
		    					AddStatusList("Write Card Data Succeed");
		    				else
		    					AddStatusList("Write Card Data Fail");
		    			}
		    			break;
		    		case CMD_READDATACARD: {
		    				int size=(byte)(mCmdData[5])+((mCmdData[6]<<8)&0xFF00);
		    				if(size>0)
		    				{
		    					memcpy(mCardData,0,mCmdData,8,size);
		    					mCardSize=size;
		    					AddStatusList("Read Card Data Succeed");
		    				}
		    				else
		    					AddStatusList("Read Card Data Fail");
		    			}
		    			break;
   		    		case CMD_GETSN:{
   		    				int size=(byte)(mCmdData[5])+((mCmdData[6]<<8)&0xFF00)-1;
   		    				if(mCmdData[7]==1) {
   		    					byte[] snb=new byte[32];
   		    					memcpy(snb,0,mCmdData,8,size);
   		    					String sn = null;
   		    					try {
   		    						sn = new String(snb,0,size,"UNICODE");
   		    					} catch (UnsupportedEncodingException e) {
   		    						e.printStackTrace();
   		    					}
   		    					AddStatusList("SN:"+sn);
   		    				}
   		    				else
   		    					AddStatusList("Get SN Fail");
   		    			}
   		    			break;
   		    		case CMD_GETBAT:{
   		    				int size=(byte)(mCmdData[5])+((mCmdData[6]<<8)&0xFF00)-1;
   		    				if(size>0)
   		    				{
   		    					memcpy(mBat,0,mCmdData,8,size);    			    					
   		    					AddStatusList("Battery Value:"+Integer.toString(mBat[0]/10)+"."+Integer.toString(mBat[0]%10)+"V");
   		    				}else
   		    					AddStatusList("Get Battery Value Fail");
   		    			}
   		    			break;
   		    		case CMD_GETCHAR:{
   		    				int size=(byte)(mCmdData[5])+((mCmdData[6]<<8)&0xFF00)-1;
		    				if(mCmdData[7]==1) {
		    					memcpy(mMatData,0,mCmdData,8,size);
		    					mMatSize=size;
		    					AddStatusList("Len="+String.valueOf(mMatSize));
		    					AddStatusList("Get Data Succeed");
		    					AddStatusListHex(mMatData,mMatSize);
		    				}
		    				else
		    					AddStatusList("Get Data Fail");
   		    			}
   		    			break;
   		    		}
   		    	}   				
   			}
   		}
    }
    
    // The Handler that gets information back from the BluetoothChatService
    private final Handler mHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
            case MESSAGE_STATE_CHANGE:
                if(D) Log.i(TAG, "MESSAGE_STATE_CHANGE: " + msg.arg1);
                switch (msg.arg1) {
                case BluetoothReaderService.STATE_CONNECTED:
                    mTitle.setText(R.string.title_connected_to);
                    mTitle.append(mConnectedDeviceName);
                    mConversationArrayAdapter.clear();
                    break;
                case BluetoothReaderService.STATE_CONNECTING:
                    mTitle.setText(R.string.title_connecting);
                    break;
                case BluetoothReaderService.STATE_LISTEN:
                case BluetoothReaderService.STATE_NONE:
                    mTitle.setText(R.string.title_not_connected);
                    break;
                }
                break;
            case MESSAGE_WRITE:
                //byte[] writeBuf = (byte[]) msg.obj;
                //AddStatusListHex(writeBuf,writeBuf.length);
                break;
            case MESSAGE_READ:
                byte[] readBuf = (byte[]) msg.obj;
                ReceiveCommand(readBuf,msg.arg1);
                //AddStatusList("Len="+Integer.toString(msg.arg1));
                //AddStatusListHex(readBuf,msg.arg1);                
                break;
            case MESSAGE_DEVICE_NAME:
                // save the connected device's name
                mConnectedDeviceName = msg.getData().getString(DEVICE_NAME);
                Toast.makeText(getApplicationContext(), "Connected to " + mConnectedDeviceName, Toast.LENGTH_SHORT).show();
                break;
            case MESSAGE_TOAST:
                Toast.makeText(getApplicationContext(), msg.getData().getString(TOAST),Toast.LENGTH_SHORT).show();
                break;
            }
        }
    };

    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if(D) Log.d(TAG, "onActivityResult " + resultCode);
        switch (requestCode) {
        case REQUEST_CONNECT_DEVICE:
            // When DeviceListActivity returns with a device to connect
            if (resultCode == Activity.RESULT_OK) {
                // Get the device MAC address
                String address = data.getExtras().getString(DeviceListActivity.EXTRA_DEVICE_ADDRESS);
                // Get the BLuetoothDevice object
                BluetoothDevice device = mBluetoothAdapter.getRemoteDevice(address);
                // Attempt to connect to the device
                mReaderService.connect(device);
                
                SharedPreferences sp;
        		sp = PreferenceManager.getDefaultSharedPreferences(this);
        		Editor edit=sp.edit();
        		edit.putString("device",address);
        		edit.commit();
            }
            break;
        case REQUEST_ENABLE_BT:
            // When the request to enable Bluetooth returns
            if (resultCode == Activity.RESULT_OK) {
                // Bluetooth is now enabled, so set up a chat session
                setupChat();
            } else {
                // User did not enable Bluetooth or an error occured
                Log.d(TAG, "BT not enabled");
                Toast.makeText(this, R.string.bt_not_enabled_leaving, Toast.LENGTH_SHORT).show();
                finish();
            }
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.option_menu, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
        case R.id.scan:
            // Launch the DeviceListActivity to see devices and do scan
            Intent serverIntent = new Intent(this, DeviceListActivity.class);
            startActivityForResult(serverIntent, REQUEST_CONNECT_DEVICE);
            return true;
        case R.id.discoverable:
            // Ensure this device is discoverable by others
            ensureDiscoverable();
            return true;
        }
        return false;
    }

    public void SavePngFile(Bitmap bmp,String filename){
		File f = new File(Environment.getExternalStorageDirectory()+"/"+filename);
		if (f.exists()) {
			f.delete();
		}
		try {
			FileOutputStream out = new FileOutputStream(f);
			bmp.compress(Bitmap.CompressFormat.PNG, 90, out);
			out.flush();
			out.close();
		} catch (IOException e) {
		}
	}
	
	public void SaveWsqFile(byte[] rawdata,int rawsize,String filename){
		byte[] outdata=new byte[73728];
		int[] outsize=new int[1];		
		wsq.getInstance().RawToWsq(rawdata,rawsize,256,288, outdata, outsize,2.833755f);
			try {
				File fs=new File(Environment.getExternalStorageDirectory()+"/"+filename);
				if(fs.exists()){
					fs.delete();
				} 
				new File(Environment.getExternalStorageDirectory()+"/"+filename);
				RandomAccessFile randomFile = new RandomAccessFile(Environment.getExternalStorageDirectory()+"/"+filename, "rw");
				long fileLength = randomFile.length();
				randomFile.seek(fileLength);
				randomFile.write(outdata, 0, outsize[0]);
				randomFile.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
	}

}