package com.fgtit.data;

import android.util.Base64;

public class fpimage {
	private static fpimage mfpi=null;
	
	public static fpimage getInstance(){
		if(mfpi==null){
			mfpi=new fpimage();
		}
		return mfpi;
	}
		
	public void ToStdImage(byte[] ipImage,byte[] opImage){
		byte[] tmpImage=new byte[212*280];		
		
		byte[] imageData = new byte[152*200];
		for (int i = 0; i < (152*200)/2; i++) {
			imageData[i * 2] = (byte) (ipImage[i] & 0xf0);
			imageData[i * 2 + 1] = (byte) (ipImage[i] << 4 & 0xf0);
		}
		ResizeImage(imageData,152,200,tmpImage,212,280,0x07);
		FillImage(tmpImage,212,280,opImage,256,288);
	}
	
	public native void FillImage(byte[] ipImage, int iSX,int iSY,byte[] opImage,int iLX,int iLY);
	public native int ResizeImage(byte[] lpsrcimg, int srcwidth,int srcheight,byte[] lpobjimag,int dstwidth,int dstheight,int ifilter);
	
	static {
		System.loadLibrary("fpimage");
	}
}