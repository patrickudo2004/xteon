#[cfg(windows)]
pub fn get_system_master_audio_peak() -> f32 {
    use std::ffi::c_void;
    use windows_sys::core::GUID;
    use windows_sys::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_ALL, COINIT_MULTITHREADED,
    };

    // Raw COM VTable definitions for WASAPI / Core Audio Endpoints
    #[repr(C)]
    struct IUnknownVtbl {
        query_interface: unsafe extern "system" fn(*mut c_void, *const GUID, *mut *mut c_void) -> i32,
        add_ref: unsafe extern "system" fn(*mut c_void) -> u32,
        release: unsafe extern "system" fn(*mut c_void) -> u32,
    }

    #[repr(C)]
    struct IMMDeviceEnumeratorVtbl {
        parent: IUnknownVtbl,
        enum_audio_endpoints: unsafe extern "system" fn(*mut c_void, i32, u32, *mut *mut c_void) -> i32,
        get_default_audio_endpoint: unsafe extern "system" fn(*mut c_void, i32, i32, *mut *mut c_void) -> i32,
        get_device: unsafe extern "system" fn(*mut c_void, *const u16, *mut *mut c_void) -> i32,
        register_endpoint_notification_callback: unsafe extern "system" fn(*mut c_void, *mut c_void) -> i32,
        unregister_endpoint_notification_callback: unsafe extern "system" fn(*mut c_void, *mut c_void) -> i32,
    }

    #[repr(C)]
    struct IMMDeviceVtbl {
        parent: IUnknownVtbl,
        activate: unsafe extern "system" fn(*mut c_void, *const GUID, u32, *mut c_void, *mut *mut c_void) -> i32,
        open_property_store: unsafe extern "system" fn(*mut c_void, u32, *mut *mut c_void) -> i32,
        get_id: unsafe extern "system" fn(*mut c_void, *mut *mut u16) -> i32,
        get_state: unsafe extern "system" fn(*mut c_void, *mut u32) -> i32,
    }

    #[repr(C)]
    struct IAudioMeterInformationVtbl {
        parent: IUnknownVtbl,
        get_peak_value: unsafe extern "system" fn(*mut c_void, *mut f32) -> i32,
        get_metering_channel_count: unsafe extern "system" fn(*mut c_void, *mut u32) -> i32,
        get_channels_peak_values: unsafe extern "system" fn(*mut c_void, u32, *mut f32) -> i32,
        query_hardware_support: unsafe extern "system" fn(*mut c_void, *mut u32) -> i32,
    }

    #[repr(C)]
    struct IMMDeviceEnumerator {
        vtbl: *const IMMDeviceEnumeratorVtbl,
    }

    #[repr(C)]
    struct IMMDevice {
        vtbl: *const IMMDeviceVtbl,
    }

    #[repr(C)]
    struct IAudioMeterInformation {
        vtbl: *const IAudioMeterInformationVtbl,
    }

    unsafe {
        // Initialize COM on this thread
        let _ = CoInitializeEx(std::ptr::null_mut(), COINIT_MULTITHREADED as _);

        // CLSID_MMDeviceEnumerator: BCDE0395-E52F-467C-8E3D-C4579291692E
        let clsid_mm_device_enumerator = GUID {
            data1: 0xBCDE0395,
            data2: 0xE52F,
            data3: 0x467C,
            data4: [0x8E, 0x3D, 0xC4, 0x57, 0x92, 0x91, 0x69, 0x2E],
        };

        // IID_IMMDeviceEnumerator: A95664D2-9614-4F35-A746-DE8DB63617E6
        let iid_imm_device_enumerator = GUID {
            data1: 0xA95664D2,
            data2: 0x9614,
            data3: 0x4F35,
            data4: [0xA7, 0x46, 0xDE, 0x8D, 0xB6, 0x36, 0x17, 0xE6],
        };

        // IID_IAudioMeterInformation: C02216F6-8C67-4B5B-9D00-D008E73E0064
        let iid_iaudio_meter_information = GUID {
            data1: 0xC02216F6,
            data2: 0x8C67,
            data3: 0x4B5B,
            data4: [0x9D, 0x00, 0xD0, 0x08, 0xE7, 0x3E, 0x00, 0x64],
        };

        let mut enumerator_ptr: *mut c_void = std::ptr::null_mut();
        let hr = CoCreateInstance(
            &clsid_mm_device_enumerator,
            std::ptr::null_mut(),
            CLSCTX_ALL,
            &iid_imm_device_enumerator,
            &mut enumerator_ptr,
        );

        if hr != 0 || enumerator_ptr.is_null() {
            CoUninitialize();
            return 0.0;
        }

        let enumerator = enumerator_ptr as *mut IMMDeviceEnumerator;
        let mut device_ptr: *mut c_void = std::ptr::null_mut();
        // eRender = 0, eConsole = 0
        let hr = ((*(*enumerator).vtbl).get_default_audio_endpoint)(
            enumerator_ptr,
            0,
            0,
            &mut device_ptr,
        );

        // Release enumerator
        ((*(*enumerator).vtbl).parent.release)(enumerator_ptr);

        if hr != 0 || device_ptr.is_null() {
            CoUninitialize();
            return 0.0;
        }

        let device = device_ptr as *mut IMMDevice;
        let mut meter_ptr: *mut c_void = std::ptr::null_mut();
        let hr = ((*(*device).vtbl).activate)(
            device_ptr,
            &iid_iaudio_meter_information,
            CLSCTX_ALL,
            std::ptr::null_mut(),
            &mut meter_ptr,
        );

        // Release device
        ((*(*device).vtbl).parent.release)(device_ptr);

        if hr != 0 || meter_ptr.is_null() {
            CoUninitialize();
            return 0.0;
        }

        let meter = meter_ptr as *mut IAudioMeterInformation;
        let mut peak: f32 = 0.0;
        let hr = ((*(*meter).vtbl).get_peak_value)(meter_ptr, &mut peak);

        // Release meter
        ((*(*meter).vtbl).parent.release)(meter_ptr);

        CoUninitialize();

        if hr != 0 || peak < 0.001 {
            0.0
        } else {
            peak.min(1.0)
        }
    }
}

#[cfg(not(windows))]
pub fn get_system_master_audio_peak() -> f32 {
    0.0
}
